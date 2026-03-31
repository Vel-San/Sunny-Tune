/**
 * @fileoverview Unit tests for the user bearer-token auth middleware.
 *
 * Prisma is mocked so these tests run without a real database.
 *
 * Tests cover:
 * - Missing Authorization header → 401
 * - Non-Bearer scheme → 401
 * - Token too short / too long → 401
 * - Unknown token (not in DB) → 401
 * - Valid token → next() called, req.userId populated
 */

import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthRequest } from "../../middleware/auth";

/** Creates a no-op NextFunction compatible with Express. */
const makeNext = () => vi.fn() as unknown as import("express").NextFunction;

// ─── Mock Prisma ───────────────────────────────────────────────────────────────

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("../../config/database", () => ({
  prisma: {
    user: { findUnique: mockFindUnique, update: vi.fn() },
  },
}));

// Import AFTER mocking
import { authenticate, optionalAuthenticate } from "../../middleware/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a minimal mock Express Response. */
function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

/** Creates a request with a given Authorization header value. */
function reqWithAuth(authHeader?: string): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as AuthRequest;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authenticate middleware", () => {
  const VALID_TOKEN = "sp_" + "a".repeat(32);
  const USER_ID = "00000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is present", async () => {
    const req = reqWithAuth();
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when scheme is not Bearer", async () => {
    const req = reqWithAuth("Basic sometoken");
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is too short (< 8 chars)", async () => {
    const req = reqWithAuth("Bearer abc");
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is too long (> 128 chars)", async () => {
    const req = reqWithAuth("Bearer " + "x".repeat(129));
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is not found in the database", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const req = reqWithAuth(`Bearer ${VALID_TOKEN}`);
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("calls next() and sets req.userId when token is valid", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: USER_ID, token: VALID_TOKEN });
    const req = reqWithAuth(`Bearer ${VALID_TOKEN}`);
    const res = mockRes();
    const next = makeNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe(USER_ID);
  });
});

describe("optionalAuthenticate middleware", () => {
  const VALID_TOKEN = "sp_" + "a".repeat(32);
  const USER_ID = "00000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next() and leaves req.userId undefined when no header is present", async () => {
    const req = reqWithAuth();
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() and leaves req.userId undefined for non-Bearer scheme", async () => {
    const req = reqWithAuth("Basic sometoken");
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() and leaves req.userId undefined when token is too short", async () => {
    const req = reqWithAuth("Bearer abc");
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });

  it("calls next() and leaves req.userId undefined when token is not in DB", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const req = reqWithAuth(`Bearer ${VALID_TOKEN}`);
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });

  it("calls next() and sets req.userId when token is valid", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: USER_ID, token: VALID_TOKEN });
    const req = reqWithAuth(`Bearer ${VALID_TOKEN}`);
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe(USER_ID);
  });

  it("calls next() without throwing when Prisma throws", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = reqWithAuth(`Bearer ${VALID_TOKEN}`);
    const res = mockRes();
    const next = makeNext();

    await optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });
});
