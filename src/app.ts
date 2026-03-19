import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { auth } from './lib/auth';
import { toNodeHandler } from "better-auth/node";
import { envVars } from './config/env';
import cookieParser from 'cookie-parser';
import { EventRoutes } from './modules/event/event.route';

const app: Application = express();

// parsers
app.use(express.json());
app.use(cors());

app.use(cookieParser());

app.use(
  cors({
    origin: [envVars.FRONTEND_URL],
    credentials: true,
  }),
);

// application routes
// app.use('/api/v1', router);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/v1/events", EventRoutes );

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Apollo Gears World!');
});

export default app;
