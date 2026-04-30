import { Request, Response, Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/database";
import { logger } from "../lib/logger";
import { stripControlChars } from "../lib/sanitize";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  destructiveLimiter,
  registerLimiter,
  writeLimiter,
} from "../middleware/rateLimiter";

export const usersRouter = Router();

// POST /api/users/register — create a new anonymous user
usersRouter.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = `sp_${randomUUID().replace(/-/g, "")}`;
      const user = await prisma.user.create({ data: { token } });
      res.status(201).json({
        token: user.token,
        userId: user.id,
        createdAt: user.createdAt,
      });
    } catch (err) {
      logger.error("Failed to register user", { err: String(err) });
      res.status(500).json({ error: "Failed to register user" });
    }
  },
);

// POST /api/users/revoke-token — invalidate the current token and issue a new one
// Useful when a token has been leaked or a user wants to log out all other devices.
usersRouter.post(
  "/revoke-token",
  authenticate,
  destructiveLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const newToken = `sp_${randomUUID().replace(/-/g, "")}`;
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { token: newToken },
      });
      res.json({ token: user.token });
    } catch (err) {
      logger.error("Failed to revoke token", { err: String(err) });
      res.status(500).json({ error: "Failed to revoke token" });
    }
  },
);

// GET /api/users/me — get current user info
usersRouter.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          token: true,
          username: true,
          createdAt: true,
          lastSeenAt: true,
          _count: { select: { configurations: true } },
        },
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (err) {
      logger.error("Failed to fetch user", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },
);

const usernameSchema = z.object({
  username: z
    .string()
    .max(50)
    .trim()
    .transform(stripControlChars)
    .nullable()
    .optional(),
});

// PATCH /api/users/me — update username
usersRouter.patch(
  "/me",
  authenticate,
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = usernameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid username" });
      return;
    }
    const username = parsed.data.username ?? null;
    // Basic printable-characters check — no control chars; allow letters,
    // numbers, spaces, underscores, hyphens, dots.
    if (username !== null && !/^[\w\s.\-]{1,50}$/u.test(username)) {
      res.status(400).json({
        error:
          "Username may only contain letters, numbers, spaces, underscores, hyphens, and dots",
      });
      return;
    }
    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { username },
        select: { id: true, username: true },
      });
      res.json(user);
    } catch (err) {
      logger.error("Failed to update username", { err: String(err) });
      res.status(500).json({ error: "Failed to update username" });
    }
  },
);
