import { createHash } from "crypto";
import { Response, Router } from "express";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "../config/database";
import {
  checkConfigCap,
  pruneNotificationsIfNeeded,
  validateUuidParams,
} from "../lib/guards";
import { logger } from "../lib/logger";
import { configsQuerySchema } from "../lib/querySchemas";
import { stripControlChars } from "../lib/sanitize";
import {
  authenticate,
  AuthRequest,
  optionalAuthenticate,
} from "../middleware/auth";
import { destructiveLimiter, writeLimiter } from "../middleware/rateLimiter";

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

// Known top-level sections of SPConfig — rejects payloads with unexpected keys.
const VALID_CONFIG_SECTIONS = new Set([
  "metadata",
  "vehicle",
  "drivingPersonality",
  "lateral",
  "longitudinal",
  "speedControl",
  "laneChange",
  "navigation",
  "interface",
  "commaAI",
  "advanced",
  "vehicleSpecific",
]);

const configDataSchema = z
  .record(z.unknown())
  .refine(
    (data) => Object.keys(data).every((k) => VALID_CONFIG_SECTIONS.has(k)),
    { message: "Config contains unrecognised top-level sections" },
  )
  .refine(
    (data) =>
      Object.values(data).every(
        (v) => v !== null && typeof v === "object" && !Array.isArray(v),
      ),
    { message: "Each config section must be a plain object" },
  );

// A Zod string schema that strips control characters after normalising.
const sanitized = (max: number) =>
  z.string().max(max).transform(stripControlChars);

const configBodySchema = z.object({
  name: sanitized(100).refine((s) => s.length > 0, "name is required"),
  description: sanitized(500).optional(),
  vehicleMake: sanitized(50).optional(),
  vehicleModel: sanitized(100).optional(),
  vehicleYear: z.number().int().min(2012).max(2030).optional(),
  config: configDataSchema,
  tags: z.array(sanitized(30)).max(20).optional(),
  category: sanitized(50).optional(),
});

// GET /api/configs — paginated list of user's configs
configsRouter.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = configsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }
    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    try {
      const [total, sharedCount, configs] = await prisma.$transaction([
        prisma.configuration.count({ where: { userId: req.userId } }),
        prisma.configuration.count({
          where: { userId: req.userId, isShared: true },
        }),
        prisma.configuration.findMany({
          where: { userId: req.userId },
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
            isReadOnly: true,
            shareToken: true,
            sharedAt: true,
            viewCount: true,
            cloneCount: true,
            version: true,
            clonedFromId: true,
            clonedFrom: { select: { id: true, name: true, shareToken: true } },
            createdAt: true,
            updatedAt: true,
            _count: { select: { ratings: true, comments: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
      ]);
      const mapped = configs.map(({ _count, ...c }) => ({
        ...c,
        ratingCount: _count.ratings,
        commentCount: _count.comments,
      }));
      res.json({
        configs: mapped,
        total,
        sharedCount,
        draftCount: total - sharedCount,
        page,
        limit,
      });
    } catch (err) {
      logger.error("Failed to fetch configurations", { err: String(err) });
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
    if (!(await checkConfigCap(req, res))) return;
    try {
      const { config: configData, ...rest } = parsed.data;
      const config = await prisma.configuration.create({
        data: { ...rest, config: configData as object, userId: req.userId! },
      });
      res.status(201).json(config);
    } catch (err) {
      logger.error("Failed to create configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to create configuration" });
    }
  },
);

// GET /api/configs/:id — get single config
configsRouter.get(
  "/:id",
  validateUuidParams("id"),
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
    } catch (err) {
      logger.error("Failed to fetch configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  },
);

// PUT /api/configs/:id — update config (saves snapshot before overwriting)
configsRouter.put(
  "/:id",
  writeLimiter,
  validateUuidParams("id"),
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
      const { config: configData, ...rest } = parsed.data;

      // Only bump version and create a snapshot when the config JSON actually
      // changes — metadata-only updates (name, description, tags, category)
      // should not increment the version counter.
      const configChanged =
        JSON.stringify(configData) !== JSON.stringify(existing.config);

      if (configChanged) {
        // Save an immutable snapshot of the current state before overwriting it.
        // Keep at most 20 snapshots per config — delete the oldest if over limit.
        const snapshotCount = await prisma.configSnapshot.count({
          where: { configId: existing.id },
        });
        if (snapshotCount >= 20) {
          const oldest = await prisma.configSnapshot.findFirst({
            where: { configId: existing.id },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          if (oldest) {
            await prisma.configSnapshot.delete({ where: { id: oldest.id } });
          }
        }
        await prisma.configSnapshot.create({
          data: {
            configId: existing.id,
            version: existing.version,
            name: existing.name,
            data: existing.config as object,
          },
        });
      }

      const updated = await prisma.configuration.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          config: configData as object,
          ...(configChanged ? { version: { increment: 1 } } : {}),
        },
      });
      res.json(updated);
    } catch (err) {
      logger.error("Failed to update configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to update configuration" });
    }
  },
);

// DELETE /api/configs/:id — delete config
configsRouter.delete(
  "/:id",
  destructiveLimiter,
  validateUuidParams("id"),
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
    } catch (err) {
      logger.error("Failed to delete configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to delete configuration" });
    }
  },
);

// POST /api/configs/:id/share — lock and share config
configsRouter.post(
  "/:id/share",
  destructiveLimiter,
  validateUuidParams("id"),
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

      // Tags and category may be supplied at share time.
      // Raise the tag limit to 20 to match the client UI.
      const tags: string[] | undefined = Array.isArray(req.body?.tags)
        ? req.body.tags.slice(0, 20).map(String)
        : undefined;
      // An empty-string category means "clear it"; treat it as null.
      const category: string | null | undefined =
        typeof req.body?.category === "string" && req.body.category.length <= 50
          ? req.body.category || null
          : undefined;

      if (existing.isShared && existing.shareToken) {
        // Already shared — update tags/category whenever either is present in
        // the request body (including an empty-string category → null clear).
        if (tags !== undefined || category !== undefined) {
          await prisma.configuration.update({
            where: { id: req.params.id },
            data: {
              ...(tags !== undefined && { tags }),
              ...(category !== undefined && { category }),
            },
          });
        }
        res.json({ shareToken: existing.shareToken });
        return;
      }

      const shareToken = nanoid();
      const updated = await prisma.configuration.update({
        where: { id: req.params.id },
        data: {
          isShared: true,
          shareToken,
          sharedAt: new Date(),
          ...(tags !== undefined && { tags }),
          ...(category !== undefined && { category }),
        },
      });
      res.json({ shareToken: updated.shareToken });
    } catch (err) {
      logger.error("Failed to share configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to share configuration" });
    }
  },
);

// POST /api/configs/:id/clone — clone config into new editable copy
configsRouter.post(
  "/:id/clone",
  destructiveLimiter,
  validateUuidParams("id"),
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
      // Enforce config cap on the cloning user
      if (!(await checkConfigCap(req, res))) return;
      // Increment clone count
      await prisma.configuration.update({
        where: { id: req.params.id },
        data: { cloneCount: { increment: 1 } },
      });

      // Notify the original config owner (skip when cloning own config)
      if (existing.userId !== req.userId) {
        await pruneNotificationsIfNeeded(existing.userId);
        await prisma.notification
          .create({
            data: {
              userId: existing.userId,
              type: "clone",
              configId: existing.id,
              payload: {},
            },
          })
          .catch((notifErr: unknown) => {
            logger.warn("Background notification failed", {
              err: String(notifErr),
            });
          });
      }

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
    } catch (err) {
      logger.error("Failed to clone configuration", { err: String(err) });
      res.status(500).json({ error: "Failed to clone configuration" });
    }
  },
);

// GET /api/configs/:id/history — list version snapshots for a config
configsRouter.get(
  "/:id/history",
  validateUuidParams("id"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
        select: { userId: true, isShared: true },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      // Allow access for the owner OR for any authenticated user if the config is publicly shared
      if (existing.userId !== req.userId && !existing.isShared) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const snapshots = await prisma.configSnapshot.findMany({
        where: { configId: req.params.id },
        select: { id: true, version: true, name: true, createdAt: true },
        orderBy: { version: "desc" },
      });
      res.json(snapshots);
    } catch (err) {
      logger.error("Failed to fetch history", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch history" });
    }
  },
);

// GET /api/configs/:id/history/:snapshotId — get single snapshot with full data
configsRouter.get(
  "/:id/history/:snapshotId",
  validateUuidParams("id", "snapshotId"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.configuration.findUnique({
        where: { id: req.params.id },
        select: { userId: true, isShared: true },
      });
      if (!existing) {
        res.status(404).json({ error: "Configuration not found" });
        return;
      }
      // Allow access for the owner OR for any authenticated user if the config is publicly shared
      if (existing.userId !== req.userId && !existing.isShared) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const snapshot = await prisma.configSnapshot.findUnique({
        where: { id: req.params.snapshotId },
      });
      if (!snapshot || snapshot.configId !== req.params.id) {
        res.status(404).json({ error: "Snapshot not found" });
        return;
      }
      res.json(snapshot);
    } catch (err) {
      logger.error("Failed to fetch snapshot", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch snapshot" });
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
          tags: true,
          category: true,
          isShared: true,
          isReadOnly: true,
          shareToken: true,
          sharedAt: true,
          viewCount: true,
          cloneCount: true,
          version: true,
          clonedFromId: true,
          clonedFrom: { select: { id: true, name: true, shareToken: true } },
          createdAt: true,
          updatedAt: true,
          user: { select: { username: true } },
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
      const { userId, user, ...rest } = config;
      res.json({
        ...rest,
        isOwn: req.userId === userId,
        authorUsername: user.username ?? null,
      });
    } catch (err) {
      logger.error("Failed to fetch shared configuration", {
        err: String(err),
      });
      res.status(500).json({ error: "Failed to fetch shared configuration" });
    }
  },
);
