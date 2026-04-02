/**
 * @fileoverview Unit tests for the admin authentication middleware.
 *
 * Tests cover both auth modes:
 *
 * Legacy mode (ADMIN_SECRET plaintext):
 *   - Missing header → 401
 *   - Wrong secret → 401
 *   - Correct secret → next() called
 *   - Length mismatch → 401
 *   - Neither env var set → 503
 *
 * Bcrypt mode (ADMIN_SECRET_HASH):
 *   - Correct plaintext verified against hash → next() called
 *   - Wrong plaintext → 401
 *   - Missing header → 401
 *   - Hash takes priority over plaintext var
 */

import { hashSync } from "bcryptjs";
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

// Pre-computed hash so individual tests don't pay the bcrypt cost during runs.
// Cost factor 4 is used here for speed; production uses 12.
const PLAIN_SECRET = "supersecretadminkey1234567890ab";
const BCRYPT_HASH = hashSync(PLAIN_SECRET, 4);

describe("adminAuth middleware — legacy plaintext (ADMIN_SECRET)", () => {
  beforeEach(() => {
    delete process.env.ADMIN_SECRET_HASH;
    process.env.ADMIN_SECRET = PLAIN_SECRET;
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SECRET_HASH;
  });

  it("calls next() when the correct secret is provided", async () => {
    const req = {
      headers: { "x-admin-secret": PLAIN_SECRET },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when X-Admin-Secret header is missing", async () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the secret is incorrect", async () => {
    const req = {
      headers: { "x-admin-secret": "wrongsecret" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the secret has correct prefix but wrong length", async () => {
    const req = {
      headers: { "x-admin-secret": "supersecretadminkey" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 503 when neither ADMIN_SECRET nor ADMIN_SECRET_HASH is configured", async () => {
    delete process.env.ADMIN_SECRET;
    const req = {
      headers: { "x-admin-secret": "anything" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("adminAuth middleware — bcrypt hash (ADMIN_SECRET_HASH)", () => {
  beforeEach(() => {
    delete process.env.ADMIN_SECRET;
    process.env.ADMIN_SECRET_HASH = BCRYPT_HASH;
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SECRET_HASH;
  });

  it("calls next() when the plaintext matches the stored hash", async () => {
    const req = {
      headers: { "x-admin-secret": PLAIN_SECRET },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when the plaintext does not match the hash", async () => {
    const req = {
      headers: { "x-admin-secret": "completelywrongsecret" },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when X-Admin-Secret header is missing", async () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("uses hash over plaintext when both env vars are set", async () => {
    // Even if ADMIN_SECRET is set, the hash takes priority
    process.env.ADMIN_SECRET = "some-other-secret-that-should-be-ignored";
    const req = {
      headers: { "x-admin-secret": PLAIN_SECRET },
    } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await adminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
