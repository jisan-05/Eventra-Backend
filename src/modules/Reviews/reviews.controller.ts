import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { reviewsService } from "./reviews.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { eventId, rating, comment } = req.body;
  const result = await reviewsService.createReview(userId, eventId, rating, comment);
  sendResponse(res, { httpStatusCode: httpStatus.CREATED, success: true, message: "Review created successfully", data: result });
});

const getEventReviews = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await reviewsService.getEventReviews(eventId as string);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Reviews fetched", data: result });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;
  const { rating, comment } = req.body;
  const result = await reviewsService.updateReview(id as string, userId, rating, comment);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Review updated", data: result });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;
  const result = await reviewsService.deleteReview(id as string, userId);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Review deleted", data: result });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await reviewsService.getMyReviews(userId);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "My reviews fetched", data: result });
});

export const reviewsController = {
  createReview,
  getEventReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
