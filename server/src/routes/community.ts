import { Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimiter";

export const communityRouter = Router();

communityRouter.use(authenticate);

// ─── Ratings ─────────────────────────────────────────────────────────────────

const ratingSchema = z.object({ value: z.number().int().min(1).max(5) });

// PUT /api/community/configs/:id/rate — upsert rating
communityRouter.put(
  "/configs/:id/rate",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = ratingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "value must be an integer 1–5" });
      return;
    }
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found or not public" });
        return;
      }
      // Users cannot rate their own config
      if (config.userId === req.userId) {
        res.status(409).json({ error: "Cannot rate your own configuration" });
        return;
      }
      const rating = await prisma.rating.upsert({
        where: {
          userId_configId: { userId: req.userId!, configId: req.params.id },
        },
        update: { value: parsed.data.value },
        create: {
          userId: req.userId!,
          configId: req.params.id,
          value: parsed.data.value,
        },
      });
      res.json(rating);
    } catch {
      res.status(500).json({ error: "Failed to save rating" });
    }
  },
);

// DELETE /api/community/configs/:id/rate — remove own rating
communityRouter.delete(
  "/configs/:id/rate",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.rating.deleteMany({
        where: { userId: req.userId, configId: req.params.id },
      });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete rating" });
    }
  },
);

// GET /api/community/configs/:id/my-rating — fetch current user's rating
communityRouter.get(
  "/configs/:id/my-rating",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rating = await prisma.rating.findUnique({
        where: {
          userId_configId: { userId: req.userId!, configId: req.params.id },
        },
      });
      res.json(rating ?? null);
    } catch {
      res.status(500).json({ error: "Failed to fetch rating" });
    }
  },
);

// ─── Comments ─────────────────────────────────────────────────────────────────

const commentSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
  authorName: z.string().max(50).trim().optional(),
});

// GET /api/community/configs/:id/comments — list comments (auth to get own token flag)
communityRouter.get(
  "/configs/:id/comments",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found" });
        return;
      }
      const comments = await prisma.comment.findMany({
        where: { configId: req.params.id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true } } },
      });
      const result = comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorId: c.userId,
        authorHandle:
          c.authorName ?? `usr_${c.user.id.replace(/-/g, "").slice(0, 8)}`,
        authorName: c.authorName ?? null,
        isOwn: c.userId === req.userId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  },
);

// POST /api/community/configs/:id/comments — add comment
communityRouter.post(
  "/configs/:id/comments",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid comment body",
        details: parsed.error.flatten(),
      });
      return;
    }
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found or not public" });
        return;
      }
      const comment = await prisma.comment.create({
        data: {
          userId: req.userId!,
          configId: req.params.id,
          body: parsed.data.body,
          authorName: parsed.data.authorName ?? null,
        },
        include: { user: { select: { id: true } } },
      });
      res.status(201).json({
        id: comment.id,
        body: comment.body,
        authorId: comment.userId,
        authorHandle:
          comment.authorName ??
          `usr_${comment.user.id.replace(/-/g, "").slice(0, 8)}`,
        authorName: comment.authorName ?? null,
        isOwn: true,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      });
    } catch {
      res.status(500).json({ error: "Failed to create comment" });
    }
  },
);

// DELETE /api/community/comments/:id — delete own comment
communityRouter.delete(
  "/comments/:id",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: req.params.id },
      });
      if (!comment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      if (comment.userId !== req.userId) {
        res.status(403).json({ error: "Cannot delete another user's comment" });
        return;
      }
      await prisma.comment.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  },
);

// ─── Public comments (no auth required) ──────────────────────────────────────

export const publicCommentsRouter = Router();

publicCommentsRouter.get(
  "/configs/:id/comments",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = await prisma.configuration.findUnique({
        where: { id: req.params.id },
      });
      if (!config || !config.isShared) {
        res.status(404).json({ error: "Config not found" });
        return;
      }
      const comments = await prisma.comment.findMany({
        where: { configId: req.params.id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true } } },
      });
      const result = comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorHandle:
          c.authorName ?? `usr_${c.user.id.replace(/-/g, "").slice(0, 8)}`,
        authorName: c.authorName ?? null,
        isOwn: false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  },
);

// GET /api/public/configs/:id/ratings — public rating summary
publicCommentsRouter.get(
  "/configs/:id/ratings",
  async (req, res: Response): Promise<void> => {
    try {
      const ratings = await prisma.rating.findMany({
        where: { configId: req.params.id },
        select: { value: true },
      });
      const sum = ratings.reduce((s, r) => s + r.value, 0);
      const breakdown: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      for (const r of ratings) {
        breakdown[r.value] = (breakdown[r.value] ?? 0) + 1;
      }
      res.json({
        avg: ratings.length > 0 ? sum / ratings.length : null,
        count: ratings.length,
        breakdown,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  },
);
