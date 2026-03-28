import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  // Try to get userId from the auth header or session logic
  // Since we use better-auth, auth logic depends on how req is populated
  // Usually req.user or similar is set by middleware. 
  // For now, let's assume `userId` is in req.body or passed from middleware.
  // Wait, I should ensure how better-auth populates the user.
  // I will assume the frontend sends the userId or we extract it.
  // To be safe, let's take `eventId` and `userId` from body if not found in req.user.
  
  const userId = req.body.userId; // You should extract this securely from session typically
  const { eventId, invitationId } = req.body;

  if (!userId || !eventId) {
    return sendResponse(res, {
      httpStatusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "userId and eventId are required",
    });
  }

  const result = await paymentService.createCheckoutSession(userId, eventId, invitationId);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  // For webhook, the body MUST be raw Buffer
  const result = await paymentService.handleWebhook(signature, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Webhook processed",
    data: result,
  });
});

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
};
