import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../lib/logger";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length < 8 || token.length > 128) {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) {
      res.status(401).json({ error: "Unknown token — register first" });
      return;
    }
    req.userId = user.id;
    next();
  } catch (err) {
    logger.error("Authentication error", { err: String(err) });
    res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Like `authenticate` but non-blocking: sets `req.userId` if a valid Bearer
 * token is present, otherwise continues without error. Used when auth is
 * optional (e.g. public shared-config view that reveals extra info to owners).
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token && token.length >= 8 && token.length <= 128) {
      try {
        const user = await prisma.user.findUnique({ where: { token } });
        if (user) req.userId = user.id;
      } catch (err) {
        // optional auth — log at debug so it doesn't noise up prod logs
        logger.debug("optionalAuthenticate DB error", { err: String(err) });
      }
    }
  }
  next();
}
