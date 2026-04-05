import { Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { stripControlChars } from "../lib/sanitize";
import { authenticate, AuthRequest } from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimiter";
import { logger } from "../lib/logger";

export const reportsRouter = Router();
reportsRouter.use(authenticate);

const reportSchema = z.object({
  targetType: z.enum(["config", "comment"]),
  targetId: z.string().uuid(),
  reason: z
    .string()
    .min(1)
    .max(500)
    .trim()
    .transform(stripControlChars)
    .refine((s) => s.length > 0, "reason cannot be empty"),
});

// POST /api/reports — submit or update a report  (one per user per target)
reportsRouter.post(
  "/",
  writeLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid report", details: parsed.error.flatten() });
      return;
    }
    const { targetType, targetId, reason } = parsed.data;

    try {
      await prisma.report.upsert({
        where: {
          reporterId_targetType_targetId: {
            reporterId: req.userId!,
            targetType,
            targetId,
          },
        },
        update: { reason },
        create: {
          reporterId: req.userId!,
          targetType,
          targetId,
          reason,
        },
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      logger.error("Failed to submit report", { err: String(err) });
      res.status(500).json({ error: "Failed to submit report" });
    }
  },
);
