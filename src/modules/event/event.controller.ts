import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { EventService } from "./event.service";

const createEvent = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
  const result = await EventService.createEvent(payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Event created successfully",
    data: result,
  });
});

export const EventController = {
    createEvent
};
