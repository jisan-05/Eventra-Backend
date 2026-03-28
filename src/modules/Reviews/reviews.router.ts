import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { reviewsController } from "./reviews.controller";

const router = Router();

router.post("/", auth(), reviewsController.createReview);
router.get("/my-reviews", auth(), reviewsController.getMyReviews);
router.get("/event/:eventId", reviewsController.getEventReviews);
router.patch("/:id", auth(), reviewsController.updateReview);
router.delete("/:id", auth(), reviewsController.deleteReview);

export const reviewsRoutes = router;
