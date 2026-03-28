import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { invitationController } from "./invitation.controller";

const router = Router();

router.post("/", auth(), invitationController.inviteUser);
router.get("/my-invitations", auth(), invitationController.getMyInvitations);
router.patch("/:id/respond", auth(), invitationController.respondToInvitation);

export const invitationRoutes = router;
