import { Request, Response } from "express";
import status from "http-status";
import { Role } from "../../generated/prisma/enums";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { EventService } from "./event.service";

const viewerFromReq = (req: Request) =>
  req.user ? { id: req.user.id, role: req.user.role as Role } : undefined;

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user?.id as string;
  const result = await EventService.createEvent(req.body, ownerId);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Event created successfully",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getAllEvents(req.query as any, viewerFromReq(req));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});

const getFeaturedEvent = catchAsync(async (_req: Request, res: Response) => {
  const result = await EventService.getFeaturedEvent();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Featured event retrieved",
    data: result,
  });
});

const setFeaturedEvent = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await EventService.setFeaturedEvent(eventId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Featured event updated",
    data: result,
  });
});

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

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await EventService.getEventById(id as string, viewerFromReq(req));

    if (!result) {
      return sendResponse(res, {
        httpStatusCode: status.NOT_FOUND,
        success: false,
        message: "Event not found",
      });
    }

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Event retrieved successfully",
      data: result,
    });
  } catch (e: any) {
    const msg = e?.message || "Forbidden";
    const code =
      msg.includes("Sign in") ? status.UNAUTHORIZED : status.FORBIDDEN;
    return sendResponse(res, {
      httpStatusCode: code,
      success: false,
      message: msg,
    });
  }
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) {
    return sendResponse(res, {
      httpStatusCode: status.UNAUTHORIZED,
      success: false,
      message: "You are unauthorized!",
    });
  }

  const result = await EventService.updateEvent(id as string, user.id as string, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event updated successfully",
    data: result,
  });
});

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

const deleteEventByOwner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const result = await EventService.deleteEventByOwner(id as string, userId as string);

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
  getAllEvents,
  getFeaturedEvent,
  setFeaturedEvent,
};
