import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { registerLimiter } from "../middleware/rateLimiter";

export const usersRouter = Router();

// POST /api/users/register — create a new anonymous user
usersRouter.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = `sp_${uuidv4().replace(/-/g, "")}`;
      const user = await prisma.user.create({ data: { token } });
      res.status(201).json({
        token: user.token,
        userId: user.id,
        createdAt: user.createdAt,
      });
    } catch {
      res.status(500).json({ error: "Failed to register user" });
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
    } catch {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },
);
