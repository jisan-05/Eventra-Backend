import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { participationController } from "./participation.controller";

const router = Router();

router.post("/:eventId/join", auth(), participationController.requestToJoin);
router.get("/my-participations", auth(), participationController.getMyParticipations);
router.get("/:eventId/participants", auth(), participationController.getEventParticipants);
router.patch("/:id/status", auth(), participationController.updateStatus);

export const participationRoutes = router;
