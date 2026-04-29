/**
 * @fileoverview Tests for query-parameter Zod schemas used in API routes.
 *
 * Tests cover:
 * - exploreQuerySchema: defaults, coercions, sort enum (including "trending")
 * - configsQuerySchema: defaults, limit clamping
 */

import { describe, expect, it } from "vitest";
import { configsQuerySchema, exploreQuerySchema } from "../../lib/querySchemas";

// ─── exploreQuerySchema ───────────────────────────────────────────────────────

describe("exploreQuerySchema", () => {
  it("applies defaults when no params supplied", () => {
    const result = exploreQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
    expect(result.data.sort).toBe("rating");
  });

  it("coerces page and limit from strings", () => {
    const result = exploreQuerySchema.safeParse({ page: "3", limit: "15" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(3);
    expect(result.data.limit).toBe(15);
  });

  it("accepts all valid sort values including trending and likes", () => {
    const sorts = [
      "rating",
      "recent",
      "views",
      "clones",
      "comments",
      "trending",
      "likes",
    ] as const;
    for (const sort of sorts) {
      const result = exploreQuerySchema.safeParse({ sort });
      expect(result.success, `sort '${sort}' should be valid`).toBe(true);
    }
  });

  it("rejects an unknown sort value", () => {
    const result = exploreQuerySchema.safeParse({ sort: "popularity" });
    expect(result.success).toBe(false);
  });

  it("clamps limit to max 50", () => {
    const result = exploreQuerySchema.safeParse({ limit: "999" });
    expect(result.success).toBe(false);
  });

  it("rejects page 0", () => {
    const result = exploreQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("coerces year from string", () => {
    const result = exploreQuerySchema.safeParse({ year: "2023" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.year).toBe(2023);
  });

  it("rejects year below 2012", () => {
    const result = exploreQuerySchema.safeParse({ year: "2010" });
    expect(result.success).toBe(false);
  });

  it("accepts optional filters left undefined", () => {
    const result = exploreQuerySchema.safeParse({
      sort: "trending",
      page: "1",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.q).toBeUndefined();
    expect(result.data.make).toBeUndefined();
    expect(result.data.spVersion).toBeUndefined();
  });
});

// ─── configsQuerySchema ───────────────────────────────────────────────────────

describe("configsQuerySchema", () => {
  it("applies defaults when no params supplied", () => {
    const result = configsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(24);
  });

  it("coerces page and limit from strings", () => {
    const result = configsQuerySchema.safeParse({ page: "2", limit: "50" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(50);
  });

  it("allows limit up to 100", () => {
    const result = configsQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.limit).toBe(100);
  });

  it("rejects limit above 100", () => {
    const result = configsQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects page 0", () => {
    const result = configsQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });
});
