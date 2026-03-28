import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { auth } from './lib/auth';
import { toNodeHandler } from "better-auth/node";
import { envVars } from './config/env';
import cookieParser from 'cookie-parser';
import { EventRoutes } from './modules/event/event.router';
import { profileRouter } from './modules/user/user.router';
import { PaymentRoutes } from './modules/Payment/payment.router';
import { paymentController } from './modules/Payment/payment.controller';
import { participationRoutes } from './modules/Participation/participation.router';
import { invitationRoutes } from './modules/Invitation/invitation.router';
import { reviewsRoutes } from './modules/Reviews/reviews.router';

const app: Application = express();

// Stripe webhook must come BEFORE global express.json()
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), paymentController.handleWebhook);

// parsers
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  }),
);

// application routes
// app.use('/api/v1', router);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/v1/events", EventRoutes );

app.use("/api/v1/users", profileRouter);

app.use("/api/v1/payments", PaymentRoutes);

app.use("/api/v1/participations", participationRoutes);

app.use("/api/v1/invitations", invitationRoutes);

app.use("/api/v1/reviews", reviewsRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Apollo Gears World!');
});

export default app;
