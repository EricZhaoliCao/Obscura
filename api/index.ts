import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./server/routers.js";
import { createContext } from "./server/_core/context.js";

const app = express();

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC middleware
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// tRPC endpoint
app.use("/api/trpc", trpcMiddleware);

// Vercel Serverless Function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
