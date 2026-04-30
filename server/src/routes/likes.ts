/**
 * @fileoverview Likes REST routes.
 *
 * A "like" is a public social signal — visible to everyone on the config.
 * Unlike favorites (private bookmarks), the like count is exposed on every
 * shared config record.
 *
 * Authentication: Bearer token (all routes require auth).
 *
 * Endpoints:
 *   POST   /api/likes/:configId        — toggle-like a shared config (idempotent add)
 *   DELETE /api/likes/:configId        — remove own like
 *   GET    /api/likes/status/:configId — check if current user has liked a config
 */

import { Response, Router } from "express";
import { prisma } from "../config/database";
import { pruneNotificationsIfNeeded, validateUuidParams } from "../lib/guards";
import { logger } from "../lib/logger";
import { authenticate, AuthRequest } from "../middleware/auth";
import { destructiveLimiter, writeLimiter } from "../middleware/rateLimiter";

export const likesRouter = Router();

likesRouter.use(authenticate);

// POST /api/likes/:configId — add a like (idempotent)
likesRouter.post(
  "/:configId",
  writeLimiter,
  validateUuidParams("configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.configId },
        select: { isShared: true, userId: true },
      });

      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found or not public" });
        return;
      }

      const like = await prisma.like.upsert({
        where: {
          userId_configId: {
            userId: req.userId!,
            configId: req.params.configId,
          },
        },
        create: { userId: req.userId!, configId: req.params.configId },
        update: {}, // already exists — no-op
      });

      // Notify the config owner when someone else likes their config
      if (config.userId !== req.userId) {
        await pruneNotificationsIfNeeded(config.userId);
        await prisma.notification
          .create({
            data: {
              userId: config.userId,
              type: "like",
              configId: req.params.configId,
              payload: {},
            },
          })
          .catch((notifErr: unknown) => {
            logger.warn("Background like-notification failed", {
              err: String(notifErr),
            });
          });
      }

      res.status(201).json(like);
    } catch (err) {
      logger.error("Failed to save like", { err: String(err) });
      res.status(500).json({ error: "Failed to save like" });
    }
  },
);

// DELETE /api/likes/:configId — remove like
likesRouter.delete(
  "/:configId",
  destructiveLimiter,
  validateUuidParams("configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.like.deleteMany({
        where: { userId: req.userId!, configId: req.params.configId },
      });
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to remove like", { err: String(err) });
      res.status(500).json({ error: "Failed to remove like" });
    }
  },
);

// GET /api/likes/status/:configId — check if the current user has liked a config
likesRouter.get(
  "/status/:configId",
  validateUuidParams("configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const like = await prisma.like.findUnique({
        where: {
          userId_configId: {
            userId: req.userId!,
            configId: req.params.configId,
          },
        },
      });
      res.set("Cache-Control", "no-store");
      res.json({ isLiked: !!like });
    } catch (err) {
      logger.error("Failed to check like status", { err: String(err) });
      res.status(500).json({ error: "Failed to check like status" });
    }
  },
);
