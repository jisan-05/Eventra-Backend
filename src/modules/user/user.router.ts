import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { profileController } from "./user.controller";
import { Role } from "../../generated/prisma/enums";


const router = Router()

// for user to see their own profile
router.get("/me",auth(),profileController.getMyProfile)

// for admin to see all user
router.get("/",auth(Role.ADMIN),profileController.getAllUser)

// for user to update their own profile
router.patch("/me",auth(),profileController.updateMyProfile)

// for admin to delete user (soft delete)
router.delete("/:id", auth(Role.ADMIN), profileController.deleteUser);

export const profileRouter = router