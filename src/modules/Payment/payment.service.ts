import { prisma } from "../../lib/prisma";
import { getStripe } from "../../lib/stripe";
import * as sslcommerz from "./sslcommerz.service";
import { assertUserHasNotPaidForEvent } from "./payment-guards";

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

  await assertUserHasNotPaidForEvent(userId, eventId);

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
    // Stripe replaces {CHECKOUT_SESSION_ID}; needed when webhook is not reachable (e.g. localhost).
    success_url: `${frontendUrl}/events/${eventId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
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

/** Shared fulfillment after Stripe marks payment paid (webhook or return-URL confirm). */
async function fulfillAfterSuccessfulStripePayment(args: {
  paymentId: string;
  userId: string;
  eventId: string;
  invitationId?: string | null;
}) {
  const { paymentId, userId, eventId, invitationId } = args;

  const row = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!row) {
    return;
  }
  if (row.userId !== userId || row.eventId !== eventId) {
    return;
  }
  if (row.status === "SUCCESS") {
    return;
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCESS" },
  });

  if (invitationId) {
    try {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
    } catch {
      /* ignore invalid invitation id */
    }
  }

  const existingParticipation = await prisma.participation.findFirst({
    where: { userId, eventId },
  });

  if (existingParticipation) {
    await prisma.participation.update({
      where: { id: existingParticipation.id },
      data: { status: "PENDING" },
    });
  } else {
    await prisma.participation.create({
      data: {
        userId,
        eventId,
        status: "PENDING",
      },
    });
  }
}

/**
 * Call after redirect from Stripe Checkout when webhooks are not configured (typical on localhost).
 * Verifies the session is paid and metadata matches the logged-in user.
 */
export const confirmStripeSessionForUser = async (userId: string, stripeSessionId: string) => {
  if (provider() !== "stripe") {
    throw new Error("Stripe confirmation is only used when PAYMENT_PROVIDER=stripe");
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Payment is not completed yet");
  }

  const metadata = session.metadata || {};
  if (metadata.userId !== userId) {
    throw new Error("This checkout session does not belong to your account");
  }

  const paymentId = session.client_reference_id || metadata.paymentId;
  const eventId = metadata.eventId;
  if (!paymentId || !eventId) {
    throw new Error("Invalid checkout session data");
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== userId) {
    throw new Error("Payment record not found");
  }

  if (payment.status === "SUCCESS") {
    return { alreadyProcessed: true as const };
  }

  const invitationId = metadata.invitationId || payment.invitationId || undefined;

  await fulfillAfterSuccessfulStripePayment({
    paymentId,
    userId,
    eventId,
    invitationId: invitationId ?? null,
  });

  return { alreadyProcessed: false as const };
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

    if (paymentId && metadata?.userId && metadata?.eventId) {
      await fulfillAfterSuccessfulStripePayment({
        paymentId,
        userId: metadata.userId,
        eventId: metadata.eventId,
        invitationId: metadata.invitationId ?? null,
      });
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

/** User has a SUCCESS payment row for this event (checkout fulfilled). */
export const getUserEventPaymentStatus = async (userId: string, eventId: string) => {
  const paid = await prisma.payment.findFirst({
    where: { userId, eventId, status: "SUCCESS" },
    select: { id: true },
  });
  return { hasSuccessfulPayment: !!paid };
};

export const paymentService = {
  createCheckoutSession,
  confirmStripeSessionForUser,
  handleWebhook,
  getUserEventPaymentStatus,
};
