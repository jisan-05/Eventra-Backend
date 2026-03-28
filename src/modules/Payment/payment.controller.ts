import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";
import * as sslcommerz from "./sslcommerz.service";

const confirmStripeSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const sessionId = (req.body?.sessionId || req.body?.session_id) as string | undefined;
  if (!sessionId || typeof sessionId !== "string") {
    return sendResponse(res, {
      httpStatusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "sessionId is required",
    });
  }

  try {
    const result = await paymentService.confirmStripeSessionForUser(userId, sessionId.trim());
    return sendResponse(res, {
      httpStatusCode: httpStatus.OK,
      success: true,
      message: result.alreadyProcessed ? "Payment already recorded" : "Payment confirmed; your request is pending host approval",
      data: result,
    });
  } catch (e: any) {
    return sendResponse(res, {
      httpStatusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: e?.message || "Could not confirm payment",
    });
  }
});

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const email = req.user?.email as string;
  const name = (req.user?.name as string) || email || "Guest";
  const { eventId, invitationId } = req.body;

  if (!eventId) {
    return sendResponse(res, {
      httpStatusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "eventId is required",
    });
  }

  const result = await paymentService.createCheckoutSession(
    userId,
    email,
    name,
    eventId,
    invitationId,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const result = await paymentService.handleWebhook(signature, req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Webhook processed",
    data: result,
  });
});

const sslcommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  try {
    const eventId = await sslcommerz.handleSslcommerzSuccessRedirect(
      req.query as Record<string, string | undefined>,
    );
    if (eventId) {
      return res.redirect(`${frontend}/events/${eventId}?success=true`);
    }
    return res.redirect(`${frontend}/events?payment=unknown`);
  } catch {
    return res.redirect(`${frontend}/events?payment=failed`);
  }
});

const sslcommerzIpn = catchAsync(async (req: Request, res: Response) => {
  try {
    await sslcommerz.handleSslcommerzIpn(req.body as Record<string, string>);
    res.send("SUCCESS");
  } catch {
    res.status(400).send("FAIL");
  }
});

export const paymentController = {
  createCheckoutSession,
  confirmStripeSession,
  handleWebhook,
  sslcommerzSuccess,
  sslcommerzIpn,
};
