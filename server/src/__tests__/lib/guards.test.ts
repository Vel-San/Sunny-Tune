/**
 * @fileoverview Unit tests for the security guard utilities in lib/guards.ts.
 *
 * Tests cover:
 * - validateUuidParams: passes valid UUIDs, rejects missing / malformed values
 * - checkConfigCap: returns false and sends 429 when limit is hit
 * - checkCollectionCap: returns false and sends 429 when limit is hit
 * - checkCollectionItemCap: same
 * - pruneNotificationsIfNeeded: calls deleteMany when count >= MAX
 */

import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthRequest } from "../../middleware/auth";

// ─── Mock Prisma ───────────────────────────────────────────────────────────────

const {
  mockConfigCount,
  mockCollectionCount,
  mockCollectionItemCount,
  mockNotificationCount,
  mockNotificationFindMany,
  mockNotificationDeleteMany,
} = vi.hoisted(() => ({
  mockConfigCount: vi.fn(),
  mockCollectionCount: vi.fn(),
  mockCollectionItemCount: vi.fn(),
  mockNotificationCount: vi.fn(),
  mockNotificationFindMany: vi.fn(),
  mockNotificationDeleteMany: vi.fn(),
}));

vi.mock("../../config/database", () => ({
  prisma: {
    configuration: { count: mockConfigCount },
    collection: { count: mockCollectionCount },
    collectionItem: { count: mockCollectionItemCount },
    notification: {
      count: mockNotificationCount,
      findMany: mockNotificationFindMany,
      deleteMany: mockNotificationDeleteMany,
    },
  },
}));

import {
  checkCollectionCap,
  checkCollectionItemCap,
  checkConfigCap,
  MAX_COLLECTIONS_PER_USER,
  MAX_CONFIGS_PER_USER,
  MAX_ITEMS_PER_COLLECTION,
  MAX_NOTIFICATIONS_PER_USER,
  pruneNotificationsIfNeeded,
  validateUuidParams,
} from "../../lib/guards";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_UUID = "00000000-0000-0000-0000-000000000001";
const BAD_VALUES = [
  "not-a-uuid",
  "123",
  "",
  " ",
  "00000000000000000000000000000001",
];

function makeNext() {
  return vi.fn() as unknown as import("express").NextFunction;
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(
  params: Record<string, string> = {},
  userId = "user-1",
): AuthRequest {
  return { params, userId } as unknown as AuthRequest;
}

// ─── validateUuidParams ───────────────────────────────────────────────────────

describe("validateUuidParams", () => {
  it("calls next() when all params are valid UUIDs", () => {
    const mw = validateUuidParams("id");
    const req = makeReq({ id: VALID_UUID });
    const res = mockRes();
    const next = makeNext();
    mw(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validates multiple params", () => {
    const mw = validateUuidParams("id", "snapshotId");
    const req = makeReq({ id: VALID_UUID, snapshotId: VALID_UUID });
    const next = makeNext();
    mw(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(BAD_VALUES)("returns 400 for bad UUID %j", (val) => {
    const mw = validateUuidParams("id");
    const req = makeReq({ id: val });
    const res = mockRes();
    const next = makeNext();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when a required param is missing from req.params", () => {
    const mw = validateUuidParams("id");
    const req = makeReq({}); // no 'id' key at all
    const res = mockRes();
    const next = makeNext();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("stops at the first invalid param and does not call next()", () => {
    const mw = validateUuidParams("id", "snapshotId");
    const req = makeReq({ id: "bad", snapshotId: VALID_UUID });
    const res = mockRes();
    const next = makeNext();
    mw(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── checkConfigCap ───────────────────────────────────────────────────────────

describe("checkConfigCap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when under the limit", async () => {
    mockConfigCount.mockResolvedValue(5);
    const res = mockRes();
    const ok = await checkConfigCap(makeReq(), res);
    expect(ok).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns false and sends 429 when at the limit", async () => {
    mockConfigCount.mockResolvedValue(MAX_CONFIGS_PER_USER);
    const res = mockRes();
    const ok = await checkConfigCap(makeReq(), res);
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("returns false and sends 429 when over the limit", async () => {
    mockConfigCount.mockResolvedValue(MAX_CONFIGS_PER_USER + 10);
    const res = mockRes();
    expect(await checkConfigCap(makeReq(), res)).toBe(false);
  });
});

// ─── checkCollectionCap ───────────────────────────────────────────────────────

describe("checkCollectionCap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when under the limit", async () => {
    mockCollectionCount.mockResolvedValue(0);
    expect(await checkCollectionCap(makeReq(), mockRes())).toBe(true);
  });

  it("returns false with 429 at the limit", async () => {
    mockCollectionCount.mockResolvedValue(MAX_COLLECTIONS_PER_USER);
    const res = mockRes();
    expect(await checkCollectionCap(makeReq(), res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

// ─── checkCollectionItemCap ───────────────────────────────────────────────────

describe("checkCollectionItemCap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when under the limit", async () => {
    mockCollectionItemCount.mockResolvedValue(10);
    expect(await checkCollectionItemCap("col-id", mockRes())).toBe(true);
  });

  it("returns false with 429 at the limit", async () => {
    mockCollectionItemCount.mockResolvedValue(MAX_ITEMS_PER_COLLECTION);
    const res = mockRes();
    expect(await checkCollectionItemCap("col-id", res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

// ─── pruneNotificationsIfNeeded ───────────────────────────────────────────────

describe("pruneNotificationsIfNeeded", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when under the cap", async () => {
    mockNotificationCount.mockResolvedValue(5);
    await pruneNotificationsIfNeeded("user-1");
    expect(mockNotificationDeleteMany).not.toHaveBeenCalled();
  });

  it("prunes when at the cap", async () => {
    mockNotificationCount.mockResolvedValue(MAX_NOTIFICATIONS_PER_USER);
    mockNotificationFindMany.mockResolvedValue([{ id: "n1" }]);
    await pruneNotificationsIfNeeded("user-1");
    expect(mockNotificationDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["n1"] } },
    });
  });

  it("swallows errors silently", async () => {
    mockNotificationCount.mockRejectedValue(new Error("DB down"));
    await expect(pruneNotificationsIfNeeded("user-1")).resolves.toBeUndefined();
  });
});
