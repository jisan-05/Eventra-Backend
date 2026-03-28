import Stripe from "stripe";
import { envVars } from "../config/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = envVars.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: "2025-02-24.acacia" as any,
      typescript: true,
    });
  }
  return _stripe;
}
