/**
 * HTTP request / response logger middleware.
 *
 * Logs one structured line per completed request containing:
 *   method, path, status code, duration (ms), and content-length.
 *
 * In production the line is emitted as JSON so Railway / Vercel Log Drains
 * and any other aggregator can filter on individual fields.
 *
 * In development the line is printed in colour with timing highlighted so
 * slow requests (>300 ms) are easy to spot.
 *
 * Health-check pings (`GET /health`) are logged at debug level so they don't
 * clutter production logs but are still visible when LOG_LEVEL=debug.
 */

import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

// ── Slow-request threshold ────────────────────────────────────────────────────
const SLOW_MS = 500; // warn if a request takes longer than this

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    const contentLength = res.getHeader("content-length");

    const meta = {
      method,
      path,
      status,
      durationMs,
      ...(contentLength !== undefined && { bytes: Number(contentLength) }),
    };

    // Health checks are noisy — log at debug so they disappear in production
    if (path === "/health") {
      logger.debug(`${method} ${path} ${status}`, meta);
      return;
    }

    if (status >= 500) {
      logger.error(`${method} ${path} ${status}`, meta);
    } else if (status >= 400) {
      logger.warn(`${method} ${path} ${status}`, meta);
    } else if (durationMs >= SLOW_MS) {
      logger.warn(`${method} ${path} ${status} SLOW`, meta);
    } else {
      logger.info(`${method} ${path} ${status}`, meta);
    }
  });

  next();
}
