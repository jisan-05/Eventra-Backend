import express from "express";
import { paymentController } from "./payment.controller";
import auth from "../../middlewares/checkAuth";

const router = express.Router();

router.post("/create-checkout-session", auth(), paymentController.createCheckoutSession);

router.get("/sslcommerz/success", paymentController.sslcommerzSuccess);

router.post(
  "/sslcommerz/ipn",
  express.urlencoded({ extended: true }),
  paymentController.sslcommerzIpn,
);

export const PaymentRoutes = router;
