import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any, // bypassing strict union type locally
  typescript: true,
});
