/**
 * Shared security guards:
 *
 * - validateUuidParams: middleware that rejects requests whose named route params
 *   are not valid UUIDs, preventing malformed IDs from ever reaching Prisma
 *   (which would throw a raw DB error).
 *
 * - Resource-cap helpers: enforce per-user limits on how many DB rows a single
 *   user can create.  Exceeding a cap returns 429 (not 403) so clients can
 *   distinguish "not allowed" from "quota exceeded".
 */

import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";

// ─── UUID format validation ───────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware factory.  Pass the route-param names you want checked.
 *
 * Example:
 *   router.get("/:id", validateUuidParams("id"), handler)
 *   router.get("/:id/history/:snapshotId", validateUuidParams("id","snapshotId"), handler)
 *
 * Returns 400 if any named param is not a valid UUID.  This prevents a class of
 * DB-level errors (Prisma panics on non-UUID values for UUID columns).
 */
export function validateUuidParams(
  ...params: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    for (const param of params) {
      const val = req.params[param];
      if (!val || !UUID_RE.test(val)) {
        res.status(400).json({ error: `Invalid ${param} — expected a UUID` });
        return;
      }
    }
    next();
  };
}

// ─── Resource caps ───────────────────────────────────────────────────────────

/**
 * Configs per user.  Prevents a single token from filling the database.
 * Default: 200 configs per user.
 */
export const MAX_CONFIGS_PER_USER = 200;

export async function checkConfigCap(
  req: AuthRequest,
  res: Response,
): Promise<boolean> {
  const count = await prisma.configuration.count({
    where: { userId: req.userId },
  });
  if (count >= MAX_CONFIGS_PER_USER) {
    res.status(429).json({
      error: `Config limit reached (max ${MAX_CONFIGS_PER_USER} per account)`,
    });
    return false;
  }
  return true;
}

/**
 * Collections per user.  Default: 50.
 */
export const MAX_COLLECTIONS_PER_USER = 50;

export async function checkCollectionCap(
  req: AuthRequest,
  res: Response,
): Promise<boolean> {
  const count = await prisma.collection.count({
    where: { userId: req.userId },
  });
  if (count >= MAX_COLLECTIONS_PER_USER) {
    res.status(429).json({
      error: `Collection limit reached (max ${MAX_COLLECTIONS_PER_USER} per account)`,
    });
    return false;
  }
  return true;
}

/**
 * Items per collection.  Default: 100.
 */
export const MAX_ITEMS_PER_COLLECTION = 100;

export async function checkCollectionItemCap(
  collectionId: string,
  res: Response,
): Promise<boolean> {
  const count = await prisma.collectionItem.count({
    where: { collectionId },
  });
  if (count >= MAX_ITEMS_PER_COLLECTION) {
    res.status(429).json({
      error: `Collection item limit reached (max ${MAX_ITEMS_PER_COLLECTION} per collection)`,
    });
    return false;
  }
  return true;
}

/**
 * Notifications per user — pruned when the cap is exceeded so the table stays
 * bounded even if a user gets spammed with clones.  Default: 200.
 *
 * Call this BEFORE creating a notification.  Returns true always (pruning
 * is best-effort — never hard-fails the parent request).
 */
export const MAX_NOTIFICATIONS_PER_USER = 200;

export async function pruneNotificationsIfNeeded(
  userId: string,
): Promise<void> {
  try {
    const count = await prisma.notification.count({ where: { userId } });
    if (count >= MAX_NOTIFICATIONS_PER_USER) {
      // Delete the oldest read notifications first, then oldest unread
      const oldest = await prisma.notification.findMany({
        where: { userId },
        orderBy: [{ readAt: "asc" }, { createdAt: "asc" }],
        take: Math.max(1, count - MAX_NOTIFICATIONS_PER_USER + 1),
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.notification.deleteMany({
          where: { id: { in: oldest.map((n) => n.id) } },
        });
      }
    }
  } catch {
    // Pruning is best-effort — swallow errors
  }
}
