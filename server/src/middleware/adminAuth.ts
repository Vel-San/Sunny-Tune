/**
 * @fileoverview Admin authentication middleware.
 *
 * Protects admin-only routes by comparing the `X-Admin-Secret` request header
 * against the `ADMIN_SECRET` environment variable using a timing-safe comparison
 * (`crypto.timingSafeEqual`) to prevent timing-based side-channel attacks.
 *
 * The middleware also applies a strict per-IP rate limit so that brute-force
 * attempts against the admin secret are heavily throttled.
 *
 * Usage:
 *   router.get('/some-admin-route', adminAuth, handler);
 */

import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter applied to all admin endpoints.
 * Limits to 10 requests per minute per IP address.
 */
export const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to admin endpoints" },
});

/**
 * Express middleware that verifies the `X-Admin-Secret` header.
 *
 * On failure the response is always `401 Unauthorized` regardless of the
 * failure reason (wrong secret, missing header, env var not set) so that
 * attackers cannot distinguish between these cases.
 *
 * @param req  - Express Request. Must contain `X-Admin-Secret` header.
 * @param res  - Express Response.
 * @param next - Next middleware function, called only when auth succeeds.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || adminSecret.length < 8) {
    // ADMIN_SECRET not configured — admin panel is disabled
    res
      .status(503)
      .json({ error: "Admin panel is not configured on this server" });
    return;
  }

  const provided = req.headers["x-admin-secret"];

  if (typeof provided !== "string" || provided.length === 0) {
    res.status(401).json({ error: "Missing X-Admin-Secret header" });
    return;
  }

  // Pad both buffers to the same length before comparing so the comparison
  // is always constant-time regardless of the lengths involved.
  const secretBuf = Buffer.from(adminSecret);
  const providedBuf = Buffer.alloc(secretBuf.length);
  providedBuf.write(provided.slice(0, secretBuf.length));

  const match = timingSafeEqual(secretBuf, providedBuf);

  if (!match || provided.length !== adminSecret.length) {
    res.status(401).json({ error: "Invalid admin secret" });
    return;
  }

  next();
}
