import { prisma } from "../../lib/prisma";

/** Prevents a second checkout after a successful payment for the same event. */
export async function assertUserHasNotPaidForEvent(userId: string, eventId: string) {
  const paid = await prisma.payment.findFirst({
    where: { userId, eventId, status: "SUCCESS" },
  });
  if (paid) {
    throw new Error("You have already paid for this event.");
  }
}
