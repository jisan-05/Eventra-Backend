import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { profileController } from "./user.controller";


const router = Router()

// for user to see their own profile
router.get("/me",auth(),profileController.getMyProfile)

// for admin to see all user
router.get("/",auth("ADMIN", "MANAGER"),profileController.getAllUser)

// for user to update their own profile
router.patch("/me",auth(),profileController.updateMyProfile)

// for admin to delete user (soft delete)
router.delete("/:id", auth("ADMIN"), profileController.deleteUser);
router.patch("/:id/role", auth("ADMIN"), profileController.updateUserRole);

export const profileRouter = router