/**
 * @fileoverview Favorites REST routes.
 *
 * Authentication: Bearer token (all routes require auth).
 *
 * Endpoints:
 *   POST   /api/favorites/:configId   — toggle-add a favorite (config must be shared)
 *   DELETE /api/favorites/:configId   — remove a favorite
 *   GET    /api/favorites             — list current user's favorited configs with metadata
 */

import { Response, Router } from "express";
import { prisma } from "../config/database";
import { validateUuidParams } from "../lib/guards";
import { authenticate, AuthRequest } from "../middleware/auth";
import { destructiveLimiter, writeLimiter } from "../middleware/rateLimiter";
import { logger } from "../lib/logger";

export const favoritesRouter = Router();

favoritesRouter.use(authenticate);

// POST /api/favorites/:configId — add to favorites (idempotent)
favoritesRouter.post(
  "/:configId",
  writeLimiter,
  validateUuidParams("configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.configId },
        select: { isShared: true },
      });

      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found or not public" });
        return;
      }

      const favorite = await prisma.favorite.upsert({
        where: {
          userId_configId: {
            userId: req.userId!,
            configId: req.params.configId,
          },
        },
        create: { userId: req.userId!, configId: req.params.configId },
        update: {}, // already exists — no-op
      });

      res.status(201).json(favorite);
    } catch (err) {
      logger.error("Failed to save favorite", { err: String(err) });
      res.status(500).json({ error: "Failed to save favorite" });
    }
  },
);

// DELETE /api/favorites/:configId — remove from favorites
favoritesRouter.delete(
  "/:configId",
  destructiveLimiter,
  validateUuidParams("configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.favorite.deleteMany({
        where: { userId: req.userId!, configId: req.params.configId },
      });
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to remove favorite", { err: String(err) });
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  },
);

// GET /api/favorites — list user's favorited configs (full card data)
favoritesRouter.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        include: {
          config: {
            select: {
              id: true,
              name: true,
              description: true,
              vehicleMake: true,
              vehicleModel: true,
              vehicleYear: true,
              config: true,
              tags: true,
              category: true,
              isShared: true,
              shareToken: true,
              sharedAt: true,
              viewCount: true,
              cloneCount: true,
              clonedFromId: true,
              clonedFrom: {
                select: { id: true, name: true, shareToken: true },
              },
              createdAt: true,
              updatedAt: true,
              ratings: { select: { value: true } },
              _count: { select: { comments: true } },
            },
          },
        },
      });

      res.json(
        favorites.map((f) => {
          const c = f.config;
          const avgRating =
            c.ratings.length > 0
              ? c.ratings.reduce(
                  (s: number, r: { value: number }) => s + r.value,
                  0,
                ) / c.ratings.length
              : null;
          const { ratings, _count, ...rest } = c;
          return {
            favoritedAt: f.createdAt,
            ...rest,
            avgRating,
            ratingCount: ratings.length,
            commentCount: _count.comments,
          };
        }),
      );
    } catch (err) {
      logger.error("Failed to fetch favorites", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  },
);

// GET /api/favorites/status/:configId — check if a config is favorited by current user
favoritesRouter.get(
  "/status/:configId",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_configId: {
            userId: req.userId!,
            configId: req.params.configId,
          },
        },
      });
      res.json({ isFavorited: !!favorite });
    } catch (err) {
      logger.error("Failed to check favorite status", { err: String(err) });
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  },
);
