import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import httpStatus from "http-status";

const createCheckoutSession = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.fee <= 0) {
    throw new Error("Event is free, no payment required.");
  }

  // Set frontend URL
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // Create a pending payment record
  const payment = await prisma.payment.create({
    data: {
      amount: event.fee,
      currency: "usd",
      userId,
      eventId,
      status: "PENDING",
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${frontendUrl}/events/${eventId}?success=true`,
    cancel_url: `${frontendUrl}/events/${eventId}?canceled=true`,
    customer_email: undefined, // Could grab user email if needed
    client_reference_id: payment.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: event.title,
            description: event.description || "Event Participation Fee",
          },
          unit_amount: Math.round(event.fee * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      eventId,
      paymentId: payment.id,
    },
  });

  // Update payment with the checkout session id
  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url };
};

const handleWebhook = async (signature: string, body: Buffer) => {
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
      // Mark payment as success
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCESS" },
      });

      // Update participation status using metadata
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
            data: { status: "APPROVED" },
          });
        } else {
          // If no participation existed yet, create one
          await prisma.participation.create({
            data: {
              userId: metadata.userId,
              eventId: metadata.eventId,
              status: "APPROVED",
              joinedAt: new Date(),
            },
          });
        }
      }
    }
  }

  return { received: true };
};

export const paymentService = {
  createCheckoutSession,
  handleWebhook,
};
