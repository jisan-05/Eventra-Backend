import { EventType, Role } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const PUBLIC_TYPES: EventType[] = [EventType.PUBLIC_FREE, EventType.PUBLIC_PAID];

type Viewer = { id: string; role: Role };

const buildVisibilityFilter = (viewer?: Viewer) => {
  if (!viewer) {
    return { type: { in: PUBLIC_TYPES } };
  }
  if (viewer.role === Role.ADMIN) {
    return {};
  }
  return {
    OR: [
      { type: { in: PUBLIC_TYPES } },
      { ownerId: viewer.id },
      { invitations: { some: { inviteeId: viewer.id } } },
      { participants: { some: { userId: viewer.id } } },
    ],
  };
};

const createEvent = async (raw: Record<string, unknown>, ownerId: string) => {
  const title = String(raw.title ?? "").trim();
  const description = String(raw.description ?? "").trim();
  const venue = raw.venue != null ? String(raw.venue) : null;
  const eventLink = raw.eventLink != null ? String(raw.eventLink) : null;
  const time = String(raw.time ?? "").trim();
  const type = raw.type as EventType;
  let fee = Number(raw.fee ?? 0);

  if (!title || !description || !time) {
    throw new Error("Title, description, and time are required");
  }
  if (!Object.values(EventType).includes(type)) {
    throw new Error("Invalid event type");
  }
  if (type === EventType.PUBLIC_FREE || type === EventType.PRIVATE_FREE) {
    fee = 0;
  }
  if ((type === EventType.PUBLIC_PAID || type === EventType.PRIVATE_PAID) && fee <= 0) {
    throw new Error("Paid events must have a registration fee greater than zero");
  }

  const date = new Date(String(raw.date));
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid event date");
  }

  return prisma.event.create({
    data: {
      title,
      description,
      venue: venue || null,
      eventLink: eventLink || null,
      date,
      time,
      type,
      fee,
      ownerId,
    },
  });
};

const getMyEvents = async (userId: string) => {
  return prisma.event.findMany({
    where: { ownerId: userId },
    orderBy: { date: "asc" },
  });
};

const getAllEvents = async (query: Record<string, unknown>, viewer?: Viewer) => {
  const search = query.search as string | undefined;
  const type = query.type as EventType | undefined;
  const upcoming = query.upcoming === "true" || query.upcoming === true;

  const visibility = buildVisibilityFilter(viewer);

  const where: Record<string, unknown> = {
    AND: [
      visibility,
      ...(type ? [{ type }] : []),
      ...(upcoming ? [{ date: { gte: new Date() } }] : []),
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { owner: { name: { contains: search, mode: "insensitive" } } },
              ],
            },
          ]
        : []),
    ],
  };

  return prisma.event.findMany({
    where,
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { date: "asc" },
  });
};

const getFeaturedEvent = async () => {
  return prisma.event.findFirst({
    where: {
      isFeatured: true,
      type: { in: PUBLIC_TYPES },
      date: { gte: new Date() },
    },
    include: { owner: { select: { name: true } } },
    orderBy: { date: "asc" },
  });
};

const setFeaturedEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (!PUBLIC_TYPES.includes(event.type)) {
    throw new Error("Only public events can be featured");
  }

  await prisma.$transaction([
    prisma.event.updateMany({ data: { isFeatured: false } }),
    prisma.event.update({
      where: { id: eventId },
      data: { isFeatured: true },
    }),
  ]);

  return prisma.event.findUnique({
    where: { id: eventId },
    include: { owner: { select: { name: true } } },
  });
};

const deleteEvent = async (eventId: string) => {
  return prisma.event.delete({ where: { id: eventId } });
};

const deleteEventByOwner = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (event.ownerId !== userId) throw new Error("You can only delete your own events");
  return prisma.event.delete({ where: { id: eventId } });
};

const canViewEvent = async (eventId: string, viewer?: Viewer) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { event: null as null, allowed: false };

  if (event.type === EventType.PUBLIC_FREE || event.type === EventType.PUBLIC_PAID) {
    return { event, allowed: true };
  }

  if (!viewer) return { event, allowed: false };

  if (viewer.role === Role.ADMIN) return { event, allowed: true };
  if (event.ownerId === viewer.id) return { event, allowed: true };

  const invited = await prisma.invitation.findFirst({
    where: { eventId, inviteeId: viewer.id },
  });
  if (invited) return { event, allowed: true };

  const part = await prisma.participation.findFirst({
    where: { eventId, userId: viewer.id },
  });
  if (part) return { event, allowed: true };

  return { event, allowed: false };
};

const getEventById = async (eventId: string, viewer?: Viewer) => {
  const { event, allowed } = await canViewEvent(eventId, viewer);
  if (!event) return null;
  if (!allowed) {
    throw new Error(
      viewer ? "You do not have access to this private event" : "Sign in to access private events",
    );
  }

  return prisma.event.findUnique({
    where: { id: eventId },
    include: { owner: { select: { name: true, image: true, email: true } } },
  });
};

const updateEvent = async (eventId: string, authorId: string, data: Record<string, unknown>) => {
  const existing = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  if (existing.ownerId !== authorId) {
    throw new Error("You are not the owner of this event");
  }

  const next: Record<string, unknown> = {
    title: data.title != null ? String(data.title).trim() : existing.title,
    description: data.description != null ? String(data.description).trim() : existing.description,
    venue: data.venue !== undefined ? (data.venue ? String(data.venue) : null) : existing.venue,
    eventLink:
      data.eventLink !== undefined ? (data.eventLink ? String(data.eventLink) : null) : existing.eventLink,
    time: data.time != null ? String(data.time).trim() : existing.time,
    date: existing.date,
    type: existing.type,
    fee: existing.fee,
  };

  if (data.date != null) {
    const d = new Date(String(data.date));
    if (Number.isNaN(d.getTime())) throw new Error("Invalid event date");
    next.date = d;
  }
  if (data.type != null) {
    const t = data.type as EventType;
    if (!Object.values(EventType).includes(t)) throw new Error("Invalid event type");
    next.type = t;
  }
  if (data.fee != null) next.fee = Number(data.fee);

  const t = next.type as EventType;
  if (t === EventType.PUBLIC_FREE || t === EventType.PRIVATE_FREE) {
    next.fee = 0;
  } else if (Number(next.fee) <= 0) {
    throw new Error("Paid events must have a registration fee greater than zero");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      title: next.title as string,
      description: next.description as string,
      venue: next.venue as string | null,
      eventLink: next.eventLink as string | null,
      date: next.date as Date,
      time: next.time as string,
      type: t,
      fee: Number(next.fee),
    },
  });
};

export const EventService = {
  createEvent,
  getMyEvents,
  deleteEvent,
  deleteEventByOwner,
  getEventById,
  updateEvent,
  getAllEvents,
  getFeaturedEvent,
  setFeaturedEvent,
  canViewEvent,
};
