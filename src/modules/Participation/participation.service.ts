import { prisma } from "../../lib/prisma";
import { ParticipationStatus, EventType } from "../../generated/prisma/enums";

const requestToJoin = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const existing = await prisma.participation.findFirst({
    where: { userId, eventId }
  });

  if (existing) throw new Error("Already requested or joined");

  if (event.type === EventType.PUBLIC_FREE) {
    return await prisma.participation.create({
      data: { userId, eventId, status: ParticipationStatus.APPROVED, joinedAt: new Date() }
    });
  } else if (event.type === EventType.PRIVATE_FREE) {
    return await prisma.participation.create({
      data: { userId, eventId, status: ParticipationStatus.PENDING }
    });
  } else {
    throw new Error("Payment is required for this event");
  }
};

const getMyParticipations = async (userId: string) => {
  return await prisma.participation.findMany({
    where: { userId },
    include: { event: true }
  });
};

const getEventParticipants = async (eventId: string, ownerId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== ownerId) throw new Error("Unauthorized");
  return await prisma.participation.findMany({
    where: { eventId },
    include: { user: true, event: true } // Need event as well sometimes in UI
  });
};

const updateStatus = async (id: string, ownerId: string, status: ParticipationStatus) => {
  const participation = await prisma.participation.findUnique({
    where: { id },
    include: { event: true }
  });

  if (!participation || participation.event.ownerId !== ownerId) {
    throw new Error("Unauthorized");
  }

  const data: any = { status };
  if (status === ParticipationStatus.APPROVED && participation.status !== ParticipationStatus.APPROVED) {
    data.joinedAt = new Date();
  }

  return await prisma.participation.update({
    where: { id },
    data
  });
};

export const participationService = {
  requestToJoin,
  getMyParticipations,
  getEventParticipants,
  updateStatus,
};
