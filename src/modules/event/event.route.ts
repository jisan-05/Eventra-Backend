import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/checkAuth";
import { Role } from "../../generated/prisma/enums";



const router = Router()

router.post("/",auth(Role.USER,Role.ADMIN), EventController.createEvent)

export const EventRoutes = router; 