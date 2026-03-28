import { prisma } from "../../lib/prisma";

const SANDBOX_INIT = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const SANDBOX_VALIDATE = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
const LIVE_INIT = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
const LIVE_VALIDATE = "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

function baseUrls() {
  const live = process.env.SSLCOMMERZ_IS_LIVE === "true";
  return {
    init: live ? LIVE_INIT : SANDBOX_INIT,
    validate: live ? LIVE_VALIDATE : SANDBOX_VALIDATE,
  };
}

function formEncode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export async function createSslcommerzSession(
  userId: string,
  eventId: string,
  invitationId: string | undefined,
  userEmail: string,
  userName: string,
) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePass) {
    throw new Error("SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD are required");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.fee <= 0) {
    throw new Error("Invalid paid event");
  }

  const tranId = `${eventId.slice(0, 8)}-${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      amount: event.fee,
      currency: "BDT",
      userId,
      eventId,
      status: "PENDING",
      provider: "sslcommerz",
      tranId,
      invitationId: invitationId ?? null,
    },
  });

  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  const backend = process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "http://localhost:5000";

  const { init } = baseUrls();

  const body = formEncode({
    store_id: storeId,
    store_passwd: storePass,
    total_amount: String(event.fee),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${backend}/api/v1/payments/sslcommerz/success`,
    fail_url: `${frontend}/events/${eventId}?payment=failed`,
    cancel_url: `${frontend}/events/${eventId}?payment=canceled`,
    ipn_url: `${backend}/api/v1/payments/sslcommerz/ipn`,
    product_name: event.title.slice(0, 120),
    product_category: "event",
    product_profile: "non-physical-goods",
    cus_name: userName.slice(0, 50),
    cus_email: userEmail,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    value_a: payment.id,
    value_b: userId,
    value_c: eventId,
    ...(invitationId ? { value_d: invitationId } : {}),
  });

  const res = await fetch(init, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    throw new Error(json.failedreason || "SSLCommerz session failed");
  }

  return { url: json.GatewayPageURL, tranId, paymentId: payment.id };
}

async function finalizeSuccessfulPayment(paymentId: string, tranId: string, valId: string) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePass) throw new Error("SSLCommerZ not configured");

  const { validate } = baseUrls();
  const q = new URLSearchParams({
    val_id: valId,
    store_id: storeId,
    store_passwd: storePass,
    format: "json",
  });

  const res = await fetch(`${validate}?${q.toString()}`);
  const data = (await res.json()) as { status?: string; tran_id?: string };

  if (data.status !== "VALID" && data.status !== "VALIDATED") {
    throw new Error("Payment validation failed");
  }
  if (data.tran_id && data.tran_id !== tranId) {
    throw new Error("Transaction mismatch");
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.tranId !== tranId) {
    throw new Error("Payment record not found");
  }
  if (payment.status === "SUCCESS") {
    return payment;
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCESS" },
  });

  const invitationId = payment.invitationId ?? undefined;
  if (invitationId) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  }

  const existing = await prisma.participation.findFirst({
    where: { userId: payment.userId, eventId: payment.eventId },
  });

  if (existing) {
    await prisma.participation.update({
      where: { id: existing.id },
      data: { status: "PENDING" },
    });
  } else {
    await prisma.participation.create({
      data: {
        userId: payment.userId,
        eventId: payment.eventId,
        status: "PENDING",
      },
    });
  }

  return prisma.payment.findUnique({ where: { id: paymentId } });
}

export async function handleSslcommerzSuccessRedirect(query: Record<string, string | undefined>) {
  const paymentId = query.paymentId || query.value_a;
  const tranId = query.tran_id;
  const valId = query.val_id;
  if (!paymentId || !tranId || !valId) {
    throw new Error("Missing payment parameters");
  }
  await finalizeSuccessfulPayment(paymentId, tranId, valId);
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  return payment?.eventId;
}

/** IPN may send fields as form body */
export async function handleSslcommerzIpn(body: Record<string, string>) {
  const paymentId = body.value_a;
  const tranId = body.tran_id;
  const valId = body.val_id;
  if (!paymentId || !tranId || !valId) {
    throw new Error("Invalid IPN payload");
  }
  await finalizeSuccessfulPayment(paymentId, tranId, valId);
}
