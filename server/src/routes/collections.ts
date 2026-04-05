import { Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import {
  checkCollectionCap,
  checkCollectionItemCap,
  validateUuidParams,
} from "../lib/guards";
import { stripControlChars } from "../lib/sanitize";
import { authenticate, AuthRequest } from "../middleware/auth";
import { destructiveLimiter, writeLimiter } from "../middleware/rateLimiter";
import { logger } from "../lib/logger";

export const collectionsRouter = Router();
collectionsRouter.use(authenticate);

const sanitized = (max: number) =>
  z.string().max(max).transform(stripControlChars);

const collectionBodySchema = z.object({
  name: sanitized(100).refine((s) => s.length > 0, "name is required"),
  description: sanitized(500).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/collections — list user's collections with item count
collectionsRouter.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const collections = await prisma.collection.findMany({
        where: { userId: req.userId },
        include: { _count: { select: { items: true } } },
        orderBy: { updatedAt: "desc" },
      });
      res.json(
        collections.map(({ _count, ...c }) => ({
          ...c,
          itemCount: _count.items,
        })),
      );
    } catch (err) {
      logger.error("Failed to fetch collections", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  },
);

// POST /api/collections — create a collection
collectionsRouter.post(
  "/",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = collectionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }
    if (!(await checkCollectionCap(req, res))) return;
    try {
      const collection = await prisma.collection.create({
        data: { ...parsed.data, userId: req.userId! },
        include: { _count: { select: { items: true } } },
      });
      const { _count, ...rest } = collection;
      res.status(201).json({ ...rest, itemCount: _count.items });
    } catch (err) {
      logger.error("Failed to create collection", { err: String(err) });
      res.status(500).json({ error: "Failed to create collection" });
    }
  },
);

// GET /api/collections/:id — get collection with its configs
collectionsRouter.get(
  "/:id",
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
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
                  isShared: true,
                  shareToken: true,
                  viewCount: true,
                  cloneCount: true,
                  version: true,
                  tags: true,
                  category: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });
      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (collection.userId !== req.userId && !collection.isPublic) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json(collection);
    } catch (err) {
      logger.error("Failed to fetch collection", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  },
);

// PUT /api/collections/:id — update name/description/visibility
collectionsRouter.put(
  "/:id",
  writeLimiter,
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = collectionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }
    try {
      const existing = await prisma.collection.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (existing.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const updated = await prisma.collection.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      res.json(updated);
    } catch (err) {
      logger.error("Failed to update collection", { err: String(err) });
      res.status(500).json({ error: "Failed to update collection" });
    }
  },
);

// DELETE /api/collections/:id — delete collection
collectionsRouter.delete(
  "/:id",
  destructiveLimiter,
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.collection.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (existing.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      await prisma.collection.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to delete collection", { err: String(err) });
      res.status(500).json({ error: "Failed to delete collection" });
    }
  },
);

// POST /api/collections/:id/items — add a config to a collection
collectionsRouter.post(
  "/:id/items",
  writeLimiter,
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const schema = z.object({ configId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "configId (UUID) is required" });
      return;
    }
    try {
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
      });
      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (collection.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      // Verify the config being added exists and belongs to this user
      const config = await prisma.configuration.findUnique({
        where: { id: parsed.data.configId },
        select: { userId: true },
      });
      if (!config || config.userId !== req.userId) {
        res.status(404).json({ error: "Config not found" });
        return;
      }
      if (!(await checkCollectionItemCap(req.params.id, res))) return;
      await prisma.collectionItem.upsert({
        where: {
          collectionId_configId: {
            collectionId: req.params.id,
            configId: parsed.data.configId,
          },
        },
        update: {},
        create: {
          collectionId: req.params.id,
          configId: parsed.data.configId,
        },
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      logger.error("Failed to add to collection", { err: String(err) });
      res.status(500).json({ error: "Failed to add to collection" });
    }
  },
);

// DELETE /api/collections/:id/items/:configId — remove a config from a collection
collectionsRouter.delete(
  "/:id/items/:configId",
  destructiveLimiter,
  validateUuidParams("id", "configId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
      });
      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (collection.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      await prisma.collectionItem.delete({
        where: {
          collectionId_configId: {
            collectionId: req.params.id,
            configId: req.params.configId,
          },
        },
      });
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to remove from collection", { err: String(err) });
      res.status(500).json({ error: "Failed to remove from collection" });
    }
  },
);
