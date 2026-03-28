import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/checkAuth";
import { Role } from "../../generated/prisma/enums";



const router = Router()

router.post("/",auth(Role.USER,Role.ADMIN), EventController.createEvent)

// Get All events 
router.get("/", EventController.getAllEvents);

// get my events
router.get("/my-events", auth(), EventController.getMyEvents);

// Get single events
router.get("/:id", EventController.getEventById);

// update event (own event)
router.patch("/:id", auth(), EventController.updateEvent);

// Admin hard delete
router.delete("/admin/:id", auth(Role.ADMIN), EventController.deleteEventAdmin);

// Owner delete
router.delete("/owner/:id", auth(Role.USER, Role.ADMIN), EventController.deleteEventByOwner);

export const EventRoutes = router;  


