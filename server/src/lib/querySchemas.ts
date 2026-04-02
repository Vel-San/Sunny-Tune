/**
 * Shared Zod schemas for validating and coercing HTTP query parameters.
 *
 * Usage in a route:
 *
 *   const parsed = exploreQuerySchema.safeParse(req.query);
 *   if (!parsed.success) {
 *     res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
 *     return;
 *   }
 *   const { page, limit, sort, q } = parsed.data;
 */

import { z } from "zod";

// ─── Reusable building blocks ─────────────────────────────────────────────────

/** Coerces a query string to a positive integer with a configurable max. */
export const coercedPage = z.coerce
  .number()
  .int()
  .min(1)
  .max(10_000)
  .default(1);
export const coercedLimit = (max: number, def: number) =>
  z.coerce.number().int().min(1).max(max).default(def);

// ─── /api/explore ─────────────────────────────────────────────────────────────

export const exploreQuerySchema = z.object({
  /** Full-text search against name / description / make / model / tags / category */
  q: z.string().max(200).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
  /** Vehicle model year — coerced from string */
  year: z.coerce.number().int().min(2012).max(2030).optional(),
  /** Comma-separated tag list */
  tags: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  sort: z
    .enum(["rating", "recent", "views", "clones", "comments", "trending"])
    .default("rating"),
  page: coercedPage,
  /** Max 50 results per page on the public explore endpoint */
  limit: coercedLimit(50, 20),
  /**
   * Minimum SunnyPilot version (metadata.sunnypilotVersion in the config JSON).
   * Filters to configs whose SP version is >= this value (semver prefix match).
   * E.g. "0.9.8" shows only configs tuned for 0.9.8 or later.
   */
  spVersion: z.string().max(20).optional(),
});

export type ExploreQuery = z.infer<typeof exploreQuerySchema>;

// ─── /api/configs (paginated list) ───────────────────────────────────────────

export const configsQuerySchema = z.object({
  page: coercedPage,
  /** Up to 100 per page for user's own configs */
  limit: coercedLimit(100, 24),
});

export type ConfigsQuery = z.infer<typeof configsQuerySchema>;

// ─── /api/admin/users and /api/admin/configs ──────────────────────────────────

export const adminListQuerySchema = z.object({
  page: coercedPage,
  /** Admin list endpoints allow up to 100 per page */
  limit: coercedLimit(100, 50),
});

export const adminConfigsQuerySchema = adminListQuerySchema.extend({
  /** Filter to shared-only configs */
  shared: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type AdminConfigsQuery = z.infer<typeof adminConfigsQuerySchema>;

// ─── /api/admin/pageviews ─────────────────────────────────────────────────────

export const pageviewsQuerySchema = z.object({
  /** Number of past days to include (1 – 365, default 30) */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type PageviewsQuery = z.infer<typeof pageviewsQuerySchema>;
