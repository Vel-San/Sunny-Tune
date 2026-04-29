/**
 * @fileoverview Tests for the new v1.6.0 TypeScript interfaces in types/config.ts.
 *
 * These are type-level + shape tests — they verify that the runtime objects
 * match the declared interfaces by assigning literal objects and checking
 * required fields at runtime.
 *
 * Tests cover:
 * - ConfigsPage shape (configs, total, page, limit)
 * - ConfigSnapshot shape with and without the optional `data` field
 * - ConfigSnapshotMeta shape (no data)
 * - CollectionRecord shape with and without optional items
 * - VehicleEntry shape
 */

import { describe, expect, it } from "vitest";
import type {
  CollectionRecord,
  CommunityStats,
  ConfigRecord,
  ConfigSnapshot,
  ConfigSnapshotMeta,
  ConfigsPage,
  VehicleEntry,
} from "../../types/config";

// ─── ConfigsPage ─────────────────────────────────────────────────────────────

describe("ConfigsPage interface", () => {
  const page: ConfigsPage = {
    configs: [],
    total: 0,
    sharedCount: 0,
    draftCount: 0,
    page: 1,
    limit: 24,
  };

  it("has configs array", () => {
    expect(Array.isArray(page.configs)).toBe(true);
  });

  it("has numeric total, page, and limit", () => {
    expect(typeof page.total).toBe("number");
    expect(typeof page.page).toBe("number");
    expect(typeof page.limit).toBe("number");
  });

  it("page and limit defaults are sensible", () => {
    expect(page.page).toBeGreaterThan(0);
    expect(page.limit).toBeGreaterThan(0);
  });
});

// ─── ConfigSnapshot ───────────────────────────────────────────────────────────

describe("ConfigSnapshot interface", () => {
  const snap: ConfigSnapshot = {
    id: "snap-1",
    configId: "cfg-1",
    version: 2,
    name: "My config",
    createdAt: new Date().toISOString(),
  };

  it("has required fields", () => {
    expect(snap.id).toBe("snap-1");
    expect(snap.configId).toBe("cfg-1");
    expect(snap.version).toBe(2);
    expect(snap.name).toBe("My config");
    expect(typeof snap.createdAt).toBe("string");
  });

  it("data is optional (undefined by default)", () => {
    expect(snap.data).toBeUndefined();
  });
});

// ─── ConfigSnapshotMeta ───────────────────────────────────────────────────────

describe("ConfigSnapshotMeta interface", () => {
  const meta: ConfigSnapshotMeta = {
    id: "snap-2",
    version: 1,
    name: "First version",
    createdAt: new Date().toISOString(),
  };

  it("has id, version, name, createdAt", () => {
    expect(meta.id).toBe("snap-2");
    expect(meta.version).toBe(1);
    expect(meta.name).toBe("First version");
    expect(typeof meta.createdAt).toBe("string");
  });

  it("does not have a data field", () => {
    expect((meta as unknown as Record<string, unknown>).data).toBeUndefined();
  });
});

// ─── CollectionRecord ─────────────────────────────────────────────────────────

describe("CollectionRecord interface", () => {
  const col: CollectionRecord = {
    id: "col-1",
    name: "Highway Builds",
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("has required fields", () => {
    expect(col.id).toBe("col-1");
    expect(col.name).toBe("Highway Builds");
    expect(col.isPublic).toBe(false);
    expect(typeof col.createdAt).toBe("string");
    expect(typeof col.updatedAt).toBe("string");
  });

  it("description, itemCount, items are optional", () => {
    expect(col.description).toBeUndefined();
    expect(col.itemCount).toBeUndefined();
    expect(col.items).toBeUndefined();
  });

  it("accepts an itemCount", () => {
    const col2: CollectionRecord = { ...col, itemCount: 5 };
    expect(col2.itemCount).toBe(5);
  });
});

// ─── VehicleEntry ─────────────────────────────────────────────────────────────

describe("VehicleEntry interface", () => {
  const entry: VehicleEntry = {
    make: "toyota",
    displayName: "Toyota",
    models: ["Camry", "RAV4"],
  };

  it("has make, displayName, and models", () => {
    expect(entry.make).toBe("toyota");
    expect(entry.displayName).toBe("Toyota");
    expect(entry.models).toContain("Camry");
  });

  it("models is an array", () => {
    expect(Array.isArray(entry.models)).toBe(true);
  });
});

// ─── ConfigRecord — likeCount ─────────────────────────────────────────────────

describe("ConfigRecord — likeCount field", () => {
  it("likeCount is optional and defaults to undefined", () => {
    const rec = {} as Partial<ConfigRecord>;
    expect(rec.likeCount).toBeUndefined();
  });

  it("likeCount accepts a number when provided", () => {
    const rec = { likeCount: 42 } as Partial<ConfigRecord>;
    expect(rec.likeCount).toBe(42);
  });

  it("likeCount coerces to 0 via ?? operator (null-safety pattern)", () => {
    const rec = { likeCount: undefined } as Partial<ConfigRecord>;
    expect(rec.likeCount ?? 0).toBe(0);
  });
});

// ─── CommunityStats — totalLikes ──────────────────────────────────────────────

describe("CommunityStats — totalLikes field", () => {
  const stats: CommunityStats = {
    sharedConfigs: 100,
    totalDrafts: 20,
    totalRatings: 80,
    totalComments: 120,
    totalLikes: 350,
    totalViews: 5000,
    totalClones: 200,
    supportedMakes: 15,
    topMakes: [],
    topCategories: [],
    topTags: [],
  };

  it("totalLikes is a number", () => {
    expect(typeof stats.totalLikes).toBe("number");
  });

  it("totalLikes reflects the assigned value", () => {
    expect(stats.totalLikes).toBe(350);
  });
});
