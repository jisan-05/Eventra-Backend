import { prisma } from "../../lib/prisma";
import { InvitationStatus, ParticipationStatus, EventType } from "../../generated/prisma/enums";

const inviteUser = async (inviterId: string, eventId: string, email: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== inviterId) throw new Error("Unauthorized to invite to this event");

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) throw new Error("User with email not found");

  const existing = await prisma.invitation.findFirst({
    where: { eventId, inviteeId: invitee.id }
  });

  if (existing) throw new Error("Already invited");

  return await prisma.invitation.create({
    data: {
      eventId,
      inviterId,
      inviteeId: invitee.id,
      status: InvitationStatus.PENDING
    }
  });
};

const getMyInvitations = async (userId: string) => {
  return await prisma.invitation.findMany({
    where: { inviteeId: userId },
    include: { event: true, inviter: { select: { name: true, email: true } } }
  });
};

const respondToInvitation = async (invitationId: string, userId: string, status: InvitationStatus) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true }
  });

  if (!invitation || invitation.inviteeId !== userId) {
    throw new Error("Invitation not found");
  }

  const updatedInv = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status, respondedAt: new Date() }
  });

  // If accepted, add to participation if FREE.
  // If PAID, the UI should prompt user to Pay & Accept and we shouldn't allow ACCEPTED here unless they bypass UI,
  // but let's enforce it:
  if (status === InvitationStatus.ACCEPTED) {
    if (invitation.event.type === EventType.PUBLIC_FREE || invitation.event.type === EventType.PRIVATE_FREE) {
      // Free events get automatic participation
      await prisma.participation.create({
        data: {
          userId,
          eventId: invitation.eventId,
          status: ParticipationStatus.APPROVED,
          joinedAt: new Date()
        }
      });
    } else {
      throw new Error("Payment is required for this event before accepting");
    }
  }

  return updatedInv;
};

export const invitationService = {
  inviteUser,
  getMyInvitations,
  respondToInvitation,
};
