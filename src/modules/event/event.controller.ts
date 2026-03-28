import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { EventService } from "./event.service";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const ownerId = req.user?.id as string;
  const result = await EventService.createEvent(payload, ownerId);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Event created successfully",
    data: result,
  });
});

// Get events based on role
const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  
  const result = await EventService.getAllEvents(req.query);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});
// Get events based on role
const getMyEvents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  const result = await EventService.getMyEvents(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});

const getEventById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await EventService.getEventById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
};

const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user
  if(!user){
    throw new Error("You are unauthorized!")
  }
  
  const result = await EventService.updateEvent(id as string,user.id as string,req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
};

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
const deleteEventByOwner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const result = await EventService.deleteEventByOwner(
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
  getMyEvents,
  deleteEventAdmin,
  deleteEventByOwner,
  getEventById,
  updateEvent,
  getAllEvents

};
