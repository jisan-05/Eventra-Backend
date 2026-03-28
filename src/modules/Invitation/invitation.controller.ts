import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { invitationService } from "./invitation.service";
import { InvitationStatus } from "../../generated/prisma/enums";

/** Host-only: invite by email; paid invites complete via payment then host approval. */
const inviteUser = catchAsync(async (req: Request, res: Response) => {
  const inviterId = req.user?.id as string;
  const { eventId, email } = req.body;
  const result = await invitationService.inviteUser(inviterId, eventId, email);
  sendResponse(res, { httpStatusCode: httpStatus.CREATED, success: true, message: "User invited successfully", data: result });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await invitationService.getMyInvitations(userId);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Invitations fetched", data: result });
});

const respondToInvitation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;
  const { status } = req.body;
  const result = await invitationService.respondToInvitation(id as string, userId, status as InvitationStatus);
  sendResponse(res, { httpStatusCode: httpStatus.OK, success: true, message: "Invitation updated", data: result });
});

export const invitationController = {
  inviteUser,
  getMyInvitations,
  respondToInvitation,
};
