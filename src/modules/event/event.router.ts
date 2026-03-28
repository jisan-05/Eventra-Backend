import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/checkAuth";
import optionalAuth from "../../middlewares/optionalAuth";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.get("/featured", EventController.getFeaturedEvent);

router.get("/my-events", auth(), EventController.getMyEvents);

router.get("/", optionalAuth(), EventController.getAllEvents);

router.post("/", auth(Role.USER, Role.ADMIN), EventController.createEvent);

router.patch("/feature/:eventId", auth(Role.ADMIN), EventController.setFeaturedEvent);

router.get("/:id", optionalAuth(), EventController.getEventById);

router.patch("/:id", auth(), EventController.updateEvent);

router.delete("/admin/:id", auth(Role.ADMIN), EventController.deleteEventAdmin);

router.delete("/owner/:id", auth(Role.USER, Role.ADMIN), EventController.deleteEventByOwner);

export const EventRoutes = router;
