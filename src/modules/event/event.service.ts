import { Event } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createEvent = async (payload: Event, ownerId: string) => {
  const result = await prisma.event.create({
    data: {
      ...payload,
      ownerId: ownerId,
    },
  });
  return result;
};

// Get events based on role
const getMyEvents = async (userId: string) => {
  return await prisma.event.findMany({
    where: { ownerId: userId },
  });
};
// Get events based on role
const getAllEvents = async (query: any) => {
  const { search, type } = query;
  const where: any = {};
  
  if (type) {
    where.type = type;
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: "insensitive" } },
      { owner: { name: { contains: search as string, mode: "insensitive" } } }
    ];
  }
  
  return await prisma.event.findMany({
    where,
    include: { owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
};

// Hard delete
const deleteEvent = async (eventId: string) => {
  return await prisma.event.delete({ where: { id: eventId } });
};

// Owner delete
const deleteEventByOwner = async (eventId: string, userId: string) => {
  console.log(eventId, userId);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  console.log("event owner id:", event?.ownerId);
  if (!event) throw new Error("Event not found");
  if (event.ownerId !== userId)
    throw new Error("You can only delete your own events");
  return await prisma.event.delete({ where: { id: eventId } });
};

// get single event
const getEventById = async (mealId: string) => {
  return await prisma.event.findUnique({
    where: {
      id: mealId,
    },
    include: { owner: { select: { name: true, image: true, email: true } } }
  });
};

// update event
const updateEvent = async (
  eventId: string,
  authorId: string,
  data: Partial<Event>,
) => {
  const eventData = await prisma.event.findUniqueOrThrow({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });
  if (eventData.ownerId !== authorId) {
    throw new Error("You are not the owner / creator of the post");
  }

  const result = await prisma.event.update({
    where: {
      id: eventData.id,
    },
    data,
  });
  return result;
};

export const EventService = {
  createEvent,
  getMyEvents, // ✅ role-based fetching
  deleteEvent,
  deleteEventByOwner,
  getEventById,
  updateEvent,
  getAllEvents,
};
