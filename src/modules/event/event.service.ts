
import { Event } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createEvent = async(payload:Event,ownerId:string) => {
 const result = await prisma.event.create({
    data: {
      ...payload,
      ownerId: ownerId
    }
 })   
 return result
}

// Get events based on role
const getEventsByRole = async (userId: string, role: string) => {
  if (role === "ADMIN") {
    // Admin can get all events
    return await prisma.event.findMany();
  } else {
    // User can get only their own events
    return await prisma.event.findMany({
      where: { ownerId: userId },
    });
  }
};

// Hard delete
const deleteEvent = async (eventId: string) => {
  return await prisma.event.delete({ where: { id: eventId } });
};

// Owner delete
const deleteEventByUser = async (eventId: string, userId: string) => {
    console.log(eventId, userId);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
    console.log("event owner id:", event?.ownerId);
  if (!event) throw new Error("Event not found");
  if (event.ownerId !== userId) throw new Error("You can only delete your own events");
  return await prisma.event.delete({ where: { id: eventId } });
};

export const EventService = {
  createEvent,
  getEventsByRole,    // ✅ role-based fetching
  deleteEvent,
  deleteEventByUser,
};