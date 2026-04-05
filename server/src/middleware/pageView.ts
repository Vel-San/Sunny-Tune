/**
 * @fileoverview Page-view tracking middleware.
 *
 * Records lightweight analytics events in the `page_views` table for every
 * GET request to the API that can be associated with a client-side navigation.
 *
 * The visitor identifier is a non-reversible SHA-256 hash of the client IP
 * address — it allows counting unique visitors without storing raw IPs.
 *
 * Usage: mount this middleware on any route you want to track.
 */

import { createHash } from "crypto";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../lib/logger";

/**
 * Derives a privacy-safe visitor ID from the client IP address by taking the
 * first 16 hex characters of its SHA-256 hash.
 *
 * @param ip - The raw IP address string from the request.
 * @returns A 16-character hex string that identifies the visitor coarsely.
 */
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Express middleware that records a `PageView` row for the current request.
 *
 * The database write is fire-and-forget — any error is logged but does NOT
 * affect the request/response cycle.
 *
 * @param req  - Express Request.
 * @param res  - Express Response (unused, passed through).
 * @param next - Next middleware; always called immediately.
 */
export function trackPageView(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const visitorId = hashIp(ip);
  const path = req.path.slice(0, 256);

  // Non-blocking write — do not await
  prisma.pageView
    .create({ data: { path, visitorId } })
    .catch((err: unknown) =>
      logger.warn("pageview tracker failed", { err: String(err) }),
    );

  next();
}
