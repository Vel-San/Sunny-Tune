/**
 * @fileoverview Unit tests for the admin authentication middleware.
 *
 * Tests cover:
 * - Missing header → 401
 * - Wrong secret → 401
 * - Correct secret → next() called
 * - ADMIN_SECRET not set in env → 503
 * - Timing-safe comparison (length mismatch never passes)
 */

import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminAuth } from "../../middleware/adminAuth";

/** Creates a no-op NextFunction compatible with Express. */
const makeNext = () => vi.fn() as unknown as import("express").NextFunction;

/** Creates a minimal mock Express Response object. */
function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("adminAuth middleware", () => {
  const ORIGINAL_ENV = process.env.ADMIN_SECRET;

  beforeEach(() => {
    process.env.ADMIN_SECRET = "supersecretadminkey1234567890ab";
  });

  afterEach(() => {
    process.env.ADMIN_SECRET = ORIGINAL_ENV;
  });

  it("calls next() when the correct secret is provided", () => {
    const req = {
      headers: { "x-admin-secret": "supersecretadminkey1234567890ab" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when X-Admin-Secret header is missing", () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the secret is incorrect", () => {
    const req = {
      headers: { "x-admin-secret": "wrongsecret" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the secret has correct content but wrong length", () => {
    // Same prefix as real secret but shorter — must not pass
    const req = {
      headers: { "x-admin-secret": "supersecretadminkey" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 503 when ADMIN_SECRET is not configured", () => {
    delete process.env.ADMIN_SECRET;
    const req = {
      headers: { "x-admin-secret": "anything" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("returns 503 when ADMIN_SECRET is set but too short (< 8 chars)", () => {
    process.env.ADMIN_SECRET = "short";
    const req = {
      headers: { "x-admin-secret": "short" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
