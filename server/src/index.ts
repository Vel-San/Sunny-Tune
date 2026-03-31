import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { trackPageView } from "./middleware/pageView";
import { globalLimiter } from "./middleware/rateLimiter";
import { apiRouter } from "./routes";
import { sharedConfigRouter } from "./routes/configs";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Secret"],
    credentials: false,
  }),
);

// ─── Parsing & Rate limiting ─────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(globalLimiter);

// ─── Page view analytics (tracks GET requests to public paths) ───────────────
app.use("/api/explore", trackPageView);
app.use("/api/shared", trackPageView);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", apiRouter);
app.use("/api/shared", sharedConfigRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `[server] listening on port ${PORT} (${process.env.NODE_ENV ?? "development"})`,
  );
});
