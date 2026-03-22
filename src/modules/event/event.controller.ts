import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { EventService } from "./event.service";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const ownerId = req.user?.id as string;
  const result = await EventService.createEvent(payload,ownerId);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Event created successfully",
    data: result,
  });
});

// Get events based on role
const getEvents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as string;

  const result = await EventService.getEventsByRole(userId, role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});

// Admin hard delete
const deleteEventAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.deleteEvent(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event deleted by admin successfully",
    data: result,
  });
});

// Owner delete
const deleteEventOwner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const result = await EventService.deleteEventByUser(
    id as string,
    userId as string,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your event deleted successfully",
    data: result,
  });
});

export const EventController = {
  createEvent,
  getEvents, // ✅ role-based fetching
  deleteEventAdmin,
  deleteEventOwner,
};
