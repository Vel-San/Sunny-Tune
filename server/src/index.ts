import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { prisma } from "./config/database";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { trackPageView } from "./middleware/pageView";
import { globalLimiter } from "./middleware/rateLimiter";
import { requestLogger } from "./middleware/requestLogger";
import { apiRouter } from "./routes";
import { sharedConfigRouter } from "./routes/configs";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // The API only serves JSON — use the most restrictive CSP possible.
    // frame-ancestors 'none' prevents this origin being embedded in a frame.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Secret"],
    credentials: false,
  }),
);

// ─── Parsing & Rate limiting ─────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(globalLimiter);

// ─── HTTP request logging ────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Page view analytics (tracks GET requests to public paths) ───────────────
app.use("/api/explore", trackPageView);
app.use("/api/shared", trackPageView);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", apiRouter);
app.use("/api/shared", sharedConfigRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok", ts: new Date().toISOString() });
  } catch {
    res
      .status(503)
      .json({ status: "degraded", db: "error", ts: new Date().toISOString() });
  }
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server (local dev & Docker only) ─────────────────────────────────
// Vercel sets VERCEL=1 automatically. In that environment the platform invokes
// the exported `app` directly as a serverless handler — no listen() needed.
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    logger.info("Server started", {
      port: PORT,
      env: process.env.NODE_ENV ?? "development",
      logLevel:
        process.env.LOG_LEVEL ??
        (process.env.NODE_ENV === "production" ? "info" : "debug"),
    });
  });
}

export default app;
