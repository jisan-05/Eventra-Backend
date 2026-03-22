import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/checkAuth";
import { Role } from "../../generated/prisma/enums";



const router = Router()

router.post("/",auth(Role.USER,Role.ADMIN), EventController.createEvent)

// Get events (Admin sees all, user sees only their own)
router.get("/", auth(Role.USER, Role.ADMIN), EventController.getEvents);

// Admin hard delete
router.delete("/admin/:id", auth(Role.ADMIN), EventController.deleteEventAdmin);

// Owner delete
router.delete("/owner/:id", auth(Role.USER, Role.ADMIN), EventController.deleteEventOwner);

export const EventRoutes = router; 