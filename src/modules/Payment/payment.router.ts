import express from "express";
import { paymentController } from "./payment.controller";

const router = express.Router();

router.post(
  "/create-checkout-session",
  // You might want to add auth middleware here if available
  paymentController.createCheckoutSession
);

export const PaymentRoutes = router;
