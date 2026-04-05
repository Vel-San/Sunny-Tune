/**
 * @fileoverview Admin REST API routes.
 *
 * All routes under `/api/admin` are protected by both `adminLimiter` and
 * `adminAuth`. They expose management operations and analytics data that are
 * not available through the regular user-facing API.
 *
 * Authentication: `X-Admin-Secret: <ADMIN_SECRET>` request header.
 *
 * Endpoints:
 *   GET  /api/admin/stats            — overview dashboard numbers
 *   GET  /api/admin/users            — paginated user list
 *   GET  /api/admin/users/:id        — single user detail
 *   DELETE /api/admin/users/:id      — delete a user (cascades)
 *   GET  /api/admin/configs          — paginated config list (all users)
 *   DELETE /api/admin/configs/:id    — delete any config
 *   PUT  /api/admin/configs/:id/unshare — force-unshare a published config
 *   GET  /api/admin/pageviews        — page view breakdown by path
 */

import { Request, Response, Router } from "express";
import { prisma } from "../config/database";
import { logger } from "../lib/logger";
import {
  adminConfigsQuerySchema,
  adminListQuerySchema,
  adminReportsQuerySchema,
  pageviewsQuerySchema,
} from "../lib/querySchemas";
import { adminAuth, adminLimiter } from "../middleware/adminAuth";

export const adminRouter = Router();

// Apply rate limiter and auth to every admin route
adminRouter.use(adminLimiter);
adminRouter.use(adminAuth);

// ─── Dashboard stats ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 *
 * Returns high-level platform metrics used on the admin dashboard.
 */
adminRouter.get(
  "/stats",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalUsers,
        totalConfigs,
        sharedConfigs,
        totalRatings,
        totalComments,
        totalPageViews,
        totalFavorites,
        totalCollections,
        totalReports,
        recentUsers,
        recentConfigs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.configuration.count(),
        prisma.configuration.count({ where: { isShared: true } }),
        prisma.rating.count(),
        prisma.comment.count(),
        prisma.pageView.count(),
        prisma.favorite.count(),
        prisma.collection.count(),
        prisma.report.count(),
        // Users registered in the last 30 days
        prisma.user.count({
          where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
        }),
        // Configs created in the last 30 days
        prisma.configuration.count({
          where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
        }),
      ]);

      res.json({
        totalUsers,
        totalConfigs,
        sharedConfigs,
        totalRatings,
        totalComments,
        totalPageViews,
        totalFavorites,
        totalCollections,
        totalReports,
        recentUsers,
        recentConfigs,
      });
    } catch (err) {
      logger.error("admin/stats failed", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?page=1&limit=50
 *
 * Returns a paginated list of all users with config/rating/comment counts.
 */
adminRouter.get(
  "/users",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = adminListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { page, limit } = parsed.data;

    try {
      const [total, users] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.findMany({
          select: {
            id: true,
            createdAt: true,
            lastSeenAt: true,
            _count: {
              select: { configurations: true, ratings: true, comments: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.json({ users, total, page, limit });
    } catch (err) {
      logger.error("admin/users failed", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

/**
 * GET /api/admin/users/:id
 *
 * Returns full detail for a single user including their configurations.
 */
adminRouter.get(
  "/users/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          createdAt: true,
          lastSeenAt: true,
          configurations: {
            select: {
              id: true,
              name: true,
              isShared: true,
              isReadOnly: true,
              shareToken: true,
              vehicleMake: true,
              vehicleModel: true,
              vehicleYear: true,
              createdAt: true,
              viewCount: true,
              cloneCount: true,
              tags: true,
              category: true,
              _count: { select: { ratings: true, comments: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { configurations: true, ratings: true, comments: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (err) {
      logger.error("admin/users/:id failed", {
        id: req.params.id,
        err: String(err),
      });
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },
);

/**
 * DELETE /api/admin/users/:id
 *
 * Permanently deletes a user and all their data (cascade).
 */
adminRouter.delete(
  "/users/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "P2025") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      logger.error("admin/users/:id DELETE failed", {
        id: req.params.id,
        err: String(err),
      });
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// ─── Configurations ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/configs?page=1&limit=50&shared=true
 *
 * Returns all configurations across all users with pagination.
 * Optional `?shared=true` filters to only shared configs.
 */
adminRouter.get(
  "/configs",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = adminConfigsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { page, limit, shared: sharedOnly, q } = parsed.data;

    try {
      const where = {
        ...(sharedOnly ? { isShared: true } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      };

      const [total, configs] = await prisma.$transaction([
        prisma.configuration.count({ where }),
        prisma.configuration.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            vehicleMake: true,
            vehicleModel: true,
            vehicleYear: true,
            isShared: true,
            isReadOnly: true,
            shareToken: true,
            sharedAt: true,
            viewCount: true,
            cloneCount: true,
            version: true,
            tags: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            _count: { select: { ratings: true, comments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.json({ configs, total, page, limit });
    } catch (err) {
      logger.error("admin/configs failed", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch configs" });
    }
  },
);

/**
 * DELETE /api/admin/configs/:id
 *
 * Hard-deletes any configuration regardless of owner.
 */
adminRouter.delete(
  "/configs/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.configuration.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "P2025") {
        res.status(404).json({ error: "Config not found" });
        return;
      }
      logger.error("admin/configs/:id DELETE failed", {
        id: req.params.id,
        err: String(err),
      });
      res.status(500).json({ error: "Failed to delete config" });
    }
  },
);

/**
 * PUT /api/admin/configs/:id/unshare
 *
 * Removes the public share on a config, clears the read-only flag,
 * and removes the share token. Used to take down inappropriate content.
 */
adminRouter.put(
  "/configs/:id/unshare",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await prisma.configuration.update({
        where: { id: req.params.id },
        data: {
          isShared: false,
          isReadOnly: false,
          shareToken: null,
          sharedAt: null,
        },
        select: { id: true, name: true, isShared: true },
      });

      res.json(updated);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "P2025") {
        res.status(404).json({ error: "Config not found" });
        return;
      }
      logger.error("admin/configs/:id/unshare failed", {
        id: req.params.id,
        err: String(err),
      });
      res.status(500).json({ error: "Failed to unshare config" });
    }
  },
);

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reports?page=1&limit=50
 *
 * Returns all pending content reports, newest first.
 */
adminRouter.get(
  "/reports",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = adminReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { page, limit } = parsed.data;
    try {
      const [total, reports] = await prisma.$transaction([
        prisma.report.count(),
        prisma.report.findMany({
          select: {
            id: true,
            reporterId: true,
            targetType: true,
            targetId: true,
            reason: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      res.json({ reports, total, page, limit });
    } catch (err) {
      logger.error("admin/reports failed", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  },
);

/**
 * DELETE /api/admin/reports/:id
 *
 * Dismisses (deletes) a report from the moderation queue.
 */
adminRouter.delete(
  "/reports/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.report.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "P2025") {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      logger.error("admin/reports/:id DELETE failed", {
        id: req.params.id,
        err: String(err),
      });
      res.status(500).json({ error: "Failed to delete report" });
    }
  },
);

// ─── Page views ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/pageviews?days=30
 *
 * Returns page view counts grouped by path for the specified number of
 * past days (default: 30, max: 365).
 *
 * Also returns a daily sparkline (counts per calendar day) for the top paths.
 */
adminRouter.get(
  "/pageviews",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = pageviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { days } = parsed.data;
    const since = new Date(Date.now() - days * 86_400_000);

    try {
      // Group by path — Prisma groupBy
      const byPath = await prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 20,
      });

      // Total for the period
      const total = await prisma.pageView.count({
        where: { createdAt: { gte: since } },
      });

      // Daily totals for a sparkline (raw query is most pragmatic here)
      const daily: { day: string; count: number }[] = await prisma.$queryRaw`
      SELECT
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

      res.json({
        total,
        byPath: byPath.map((r) => ({ path: r.path, count: r._count.path })),
        daily,
      });
    } catch (err) {
      logger.error("admin/pageviews failed", { err: String(err) });
      res.status(500).json({ error: "Failed to fetch page view data" });
    }
  },
);
