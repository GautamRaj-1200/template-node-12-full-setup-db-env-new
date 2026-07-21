import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import type { Express } from 'express';

const app: Express = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

import { ApiError } from './utils/ApiError.js';
import { errorHandler } from './middleware/error.middleware.js';

// import authRoutes from "./routes/auth.routes.js"
// Routes
// app.use("/api/v1/auth",authRoutes)

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// Error middleware (ALWAYS LAST)
app.use(errorHandler);

export default app;
