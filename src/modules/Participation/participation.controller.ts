import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { participationService } from "./participation.service";

/** Free public joins immediately; free private creates PENDING; paid flows use checkout instead. */
const requestToJoin = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { eventId } = req.params;
  const result = await participationService.requestToJoin(userId as string, eventId as string);
  sendResponse(res, { httpStatusCode: httpStatus.CREATED, success: true, message: "Joined or requested successfully", data: result });
});

const getMyParticipations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await participationService.getMyParticipations(userId as string);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Participations fetched", data: result });
});

const getEventParticipants = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user?.id as string;
  const { eventId } = req.params;
  const result = await participationService.getEventParticipants(eventId as string, ownerId);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Participants fetched", data: result });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user?.id as string;
  const { id } = req.params;
  const { status } = req.body;
  const result = await participationService.updateStatus(id as string, ownerId, status);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Status updated", data: result });
});

export const participationController = {
  requestToJoin,
  getMyParticipations,
  getEventParticipants,
  updateStatus,
};
