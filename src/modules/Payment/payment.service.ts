import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import * as sslcommerz from "./sslcommerz.service";

const provider = () => (process.env.PAYMENT_PROVIDER || "stripe").toLowerCase();

const createStripeCheckoutSession = async (
  userId: string,
  eventId: string,
  invitationId?: string,
) => {
  const stripe = getStripe();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.fee <= 0) {
    throw new Error("Event is free, no payment required.");
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const payment = await prisma.payment.create({
    data: {
      amount: event.fee,
      currency: "usd",
      userId,
      eventId,
      status: "PENDING",
      provider: "stripe",
      invitationId: invitationId ?? null,
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${frontendUrl}/events/${eventId}?success=true`,
    cancel_url: `${frontendUrl}/events/${eventId}?canceled=true`,
    client_reference_id: payment.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: event.title,
            description: event.description || "Event Participation Fee",
          },
          unit_amount: Math.round(event.fee * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      eventId,
      paymentId: payment.id,
      ...(invitationId && { invitationId }),
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url };
};

export const createCheckoutSession = async (
  userId: string,
  userEmail: string,
  userName: string,
  eventId: string,
  invitationId?: string,
) => {
  const p = provider();
  if (p === "sslcommerz") {
    return sslcommerz.createSslcommerzSession(userId, eventId, invitationId, userEmail, userName);
  }
  if (p === "stripe") {
    return createStripeCheckoutSession(userId, eventId, invitationId);
  }
  if (p === "shurjopay") {
    throw new Error(
      "ShurjoPay is not wired in this build. Use PAYMENT_PROVIDER=stripe or sslcommerz, or add a ShurjoPay adapter alongside sslcommerz.service.ts.",
    );
  }
  throw new Error(`Unknown PAYMENT_PROVIDER "${p}". Use stripe or sslcommerz.`);
};

const handleStripeWebhook = async (signature: string, body: Buffer) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing Stripe webhook secret");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const paymentId = session.client_reference_id;
    const metadata = session.metadata;

    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCESS" },
      });

      if (metadata && metadata.invitationId) {
        await prisma.invitation.update({
          where: { id: metadata.invitationId },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        });
      }

      if (metadata && metadata.userId && metadata.eventId) {
        const existingParticipation = await prisma.participation.findFirst({
          where: {
            userId: metadata.userId,
            eventId: metadata.eventId,
          },
        });

        if (existingParticipation) {
          await prisma.participation.update({
            where: { id: existingParticipation.id },
            data: { status: "PENDING" },
          });
        } else {
          await prisma.participation.create({
            data: {
              userId: metadata.userId,
              eventId: metadata.eventId,
              status: "PENDING",
            },
          });
        }
      }
    }
  }

  return { received: true };
};

export const handleWebhook = async (signature: string, body: Buffer) => {
  if (provider() !== "stripe") {
    return { received: true, message: "Stripe webhook skipped for current PAYMENT_PROVIDER" };
  }
  return handleStripeWebhook(signature, body);
};

export const paymentService = {
  createCheckoutSession,
  handleWebhook,
};
