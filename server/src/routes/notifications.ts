import { Response, Router } from "express";
import { prisma } from "../config/database";
import { validateUuidParams } from "../lib/guards";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logger } from "../lib/logger";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// GET /api/notifications — fetch user's notifications (unread first, capped at 50)
notificationsRouter.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.userId },
        include: {
          config: { select: { id: true, name: true, shareToken: true } },
        },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      });
      res.json(notifications);
    } catch (err) {
      logger.error("Failed to fetch notifications", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
);

// GET /api/notifications/unread-count
notificationsRouter.get(
  "/unread-count",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.userId, readAt: null },
      });
      res.json({ count });
    } catch (err) {
      logger.error("Failed to fetch unread count", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  },
);

// POST /api/notifications/mark-read — mark all unread notifications as read
notificationsRouter.post(
  "/mark-read",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.userId, readAt: null },
        data: { readAt: new Date() },
      });
      res.json({ ok: true });
    } catch (err) {
      logger.error("Failed to mark notifications as read", {
        err: String(err),
      });
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  },
);

// DELETE /api/notifications/:id — delete a single notification
notificationsRouter.delete(
  "/:id",
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.notification.deleteMany({
        where: { id: req.params.id, userId: req.userId },
      });
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to delete notification", { err: String(err) });
      res.status(500).json({ error: "Failed to delete notification" });
    }
  },
);
