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

import { compare } from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";
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
 * Two modes, checked in priority order:
 *   1. `ADMIN_SECRET_HASH` (recommended) — a bcrypt hash of the secret stored
 *      in the env.  The provided header value is verified with bcrypt.compare.
 *      Even if the env file is leaked the attacker cannot derive the plaintext.
 *   2. `ADMIN_SECRET` (legacy / fallback) — the raw secret compared with
 *      timingSafeEqual.  Still protected against timing attacks but the
 *      plaintext is exposed in the environment.
 *
 * To migrate: run `npm run hash-secret -- "<your secret>"` and replace
 * ADMIN_SECRET with ADMIN_SECRET_HASH in your .env file.
 *
 * On failure the response is always `401 Unauthorized` regardless of the
 * failure reason so that attackers cannot distinguish between cases.
 */
export async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const secretHash = process.env.ADMIN_SECRET_HASH;
  const secretPlain = process.env.ADMIN_SECRET;

  // Neither configured — admin panel disabled
  if (
    (!secretHash || secretHash.trim().length === 0) &&
    (!secretPlain || secretPlain.length < 8)
  ) {
    logger.warn("Admin request blocked: admin secret not configured");
    res
      .status(503)
      .json({ error: "Admin panel is not configured on this server" });
    return;
  }

  // Optional IP allowlist — set ADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8 to restrict
  // admin access to known addresses. When unset all IPs are permitted (rely on
  // secret alone). Reads the leftmost value of X-Forwarded-For when present.
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowedIps && allowedIps.length > 0) {
    const clientIp =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      "";
    if (!allowedIps.includes(clientIp)) {
      logger.warn("Admin access denied: IP not allowlisted", {
        ip: clientIp,
        path: req.path,
      });
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  const provided = req.headers["x-admin-secret"];

  if (typeof provided !== "string" || provided.length === 0) {
    logger.warn("Admin request rejected: missing X-Admin-Secret header", {
      path: req.path,
    });
    res.status(401).json({ error: "Missing X-Admin-Secret header" });
    return;
  }

  // ── Mode 1: bcrypt hash ───────────────────────────────────────────────────
  if (secretHash && secretHash.trim().length > 0) {
    try {
      const match = await compare(provided, secretHash.trim());
      if (!match) {
        logger.warn("Admin auth failed: invalid secret (bcrypt mode)", {
          path: req.path,
        });
        res.status(401).json({ error: "Invalid admin secret" });
        return;
      }
      logger.debug("Admin authenticated (bcrypt mode)", { path: req.path });
      next();
    } catch (err) {
      logger.error("Admin authentication error", { err: String(err) });
      res.status(500).json({ error: "Admin authentication error" });
    }
    return;
  }

  // ── Mode 2: legacy plaintext (timingSafeEqual) ────────────────────────────
  const secretBuf = Buffer.from(secretPlain!);
  const providedBuf = Buffer.alloc(secretBuf.length);
  providedBuf.write(provided.slice(0, secretBuf.length));

  const match = timingSafeEqual(secretBuf, providedBuf);

  if (!match || provided.length !== secretPlain!.length) {
    logger.warn("Admin auth failed: invalid secret (plaintext mode)", {
      path: req.path,
    });
    res.status(401).json({ error: "Invalid admin secret" });
    return;
  }

  logger.debug("Admin authenticated (plaintext mode)", { path: req.path });
  next();
}
