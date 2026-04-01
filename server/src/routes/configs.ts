import { createHash } from "crypto";
import { Response, Router } from "express";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "../config/database";
import {
  authenticate,
  AuthRequest,
  optionalAuthenticate,
} from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimiter";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

export const configsRouter = Router();

// ─── View deduplication ───────────────────────────────────────────────────────
// Tracks recently-seen (configId, visitorId) pairs to avoid counting page
// refreshes as separate views. Uses a TTL of 24 h; the Map is in-process so
// it resets on container restart (acceptable for a soft view counter).

const VIEW_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const recentViews = new Map<string, number>(); // key → expiry timestamp

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Returns true and records the visit if this (configId, visitorId) pair
 * hasn't been seen within the last 24 h. Returns false if it's a repeat.
 */
function isNewView(configId: string, req: AuthRequest): boolean {
  const rawIp =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ??
    req.socket.remoteAddress ??
    "unknown";
  const key = `${configId}:${hashIp(rawIp)}`;
  const now = Date.now();
  const expiry = recentViews.get(key);
  if (expiry && expiry > now) return false; // already counted
  recentViews.set(key, now + VIEW_TTL_MS);
  // Periodically evict expired entries to keep the Map bounded
  if (recentViews.size > 10_000) {
    for (const [k, exp] of recentViews) {
      if (exp <= now) recentViews.delete(k);
    }
  }
  return true;
}

// All routes require authentication
configsRouter.use(authenticate);

const configBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(2012).max(2030).optional(),
  config: z.record(z.unknown()),
  tags: z.array(z.string().max(30)).max(10).optional(),
  category: z.string().max(50).optional(),
});

// GET /api/configs — list user's configs
configsRouter.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const configs = await prisma.configuration.findMany({
        where: { userId: req.userId },
        select: {
          id: true,
          name: true,
          description: true,
          vehicleMake: true,
          vehicleModel: true,
          vehicleYear: true,
          tags: true,
          category: true,
          isShared: true,
          isReadOnly: true,
          shareToken: true,
          sharedAt: true,
          viewCount: true,
          cloneCount: true,
          clonedFromId: true,
          clonedFrom: { select: { id: true, name: true, shareToken: true } },
          createdAt: true,
          updatedAt: true,
          _count: { select: { ratings: true, comments: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      res.json(configs);
    } catch {
      res.status(500).json({ error: "Failed to fetch configurations" });
    }
  },
);

// POST /api/configs — create config
configsRouter.post(
  "/",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = configBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }
    try {
      const { config: configData, ...rest } = parsed.data;
      const config = await prisma.configuration.create({
        data: { ...rest, config: configData as object, userId: req.userId! },
      });
      res.status(201).json(config);
    } catch {
      res.status(500).json({ error: "Failed to create configuration" });
    }
  },
);

// GET /api/configs/:id — get single config
configsRouter.get(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.id },
        include: {
          clonedFrom: { select: { id: true, name: true, shareToken: true } },
        },
      });
      if (!config) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      if (config.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      // Increment view count for shared configs viewed by others
      res.json(config);
    } catch {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  },
);

// PUT /api/configs/:id — update config
configsRouter.put(
  "/:id",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = configBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      if (existing.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (existing.isReadOnly) {
        res
          .status(409)
          .json({ error: "Configuration is read-only after sharing" });
        return;
      }
      const { config: configData, ...rest } = parsed.data;
      const updated = await prisma.configuration.update({
        where: { id: req.params.id },
        data: { ...rest, config: configData as object },
      });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update configuration" });
    }
  },
);

// DELETE /api/configs/:id — delete config
configsRouter.delete(
  "/:id",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      if (existing.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      await prisma.configuration.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete configuration" });
    }
  },
);

// POST /api/configs/:id/share — lock and share config
configsRouter.post(
  "/:id/share",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      if (existing.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (existing.isShared && existing.shareToken) {
        res.json({ shareToken: existing.shareToken });
        return;
      }
      const shareToken = nanoid();
      const updated = await prisma.configuration.update({
        where: { id: req.params.id },
        data: {
          isShared: true,
          isReadOnly: true,
          shareToken,
          sharedAt: new Date(),
        },
      });
      res.json({ shareToken: updated.shareToken });
    } catch {
      res.status(500).json({ error: "Failed to share configuration" });
    }
  },
);

// POST /api/configs/:id/clone — clone config into new editable copy
configsRouter.post(
  "/:id/clone",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      // Allow cloning own configs or shared configs
      if (existing.userId !== req.userId && !existing.isShared) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      // Increment clone count
      await prisma.configuration.update({
        where: { id: req.params.id },
        data: { cloneCount: { increment: 1 } },
      });
      const cloned = await prisma.configuration.create({
        data: {
          userId: req.userId!,
          name: `${existing.name} (clone)`,
          description: existing.description ?? undefined,
          vehicleMake: existing.vehicleMake ?? undefined,
          vehicleModel: existing.vehicleModel ?? undefined,
          vehicleYear: existing.vehicleYear ?? undefined,
          config: existing.config as object,
          clonedFromId: existing.id,
        },
        include: {
          clonedFrom: {
            select: { id: true, name: true, shareToken: true },
          },
        },
      });
      res.status(201).json(cloned);
    } catch {
      res.status(500).json({ error: "Failed to clone configuration" });
    }
  },
);

// GET /api/configs/shared/:shareToken — public shared config view (no auth)
// Note: This is mounted at the root level, separate router below
export const sharedConfigRouter = Router();

sharedConfigRouter.get(
  "/:shareToken",
  optionalAuthenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { shareToken: req.params.shareToken },
        select: {
          id: true,
          userId: true,
          name: true,
          description: true,
          vehicleMake: true,
          vehicleModel: true,
          vehicleYear: true,
          config: true,
          isShared: true,
          isReadOnly: true,
          shareToken: true,
          sharedAt: true,
          viewCount: true,
          cloneCount: true,
          clonedFromId: true,
          clonedFrom: { select: { id: true, name: true, shareToken: true } },
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!config || !config.isShared) {
        res.status(404).json({ error: "Shared configuration not found" });
        return;
      }
      // Increment view count only for unique visitors (deduplicated per 24 h)
      if (isNewView(config.id, req)) {
        await prisma.configuration.update({
          where: { shareToken: req.params.shareToken },
          data: { viewCount: { increment: 1 } },
        });
      }
      // Strip internal userId; expose isOwn flag so the client can hide self-rating
      const { userId, ...rest } = config;
      res.json({ ...rest, isOwn: req.userId === userId });
    } catch {
      res.status(500).json({ error: "Failed to fetch shared configuration" });
    }
  },
);
