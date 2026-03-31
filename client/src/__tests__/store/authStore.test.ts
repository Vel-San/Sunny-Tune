/**
 * @fileoverview Unit tests for the authStore Zustand store.
 *
 * The API functions (registerUser, fetchMe) are mocked so these tests run
 * without a real server.
 *
 * Tests cover:
 * - Initial state is not authenticated
 * - init() registers a new token when localStorage is empty
 * - init() reuses an existing token from localStorage
 * - init() sets user and initialized flag on success
 * - init() sets error flag on failure
 * - logout() clears token, user, and localStorage
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../store/authStore";

// ─── Mock API ────────────────────────────────────────────────────────────────

const mockRegisterUser = vi.fn();
const mockFetchMe = vi.fn();

vi.mock("../../api", () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
  fetchMe: (...args: unknown[]) => mockFetchMe(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resets the store and localStorage to a clean state. */
function resetAll() {
  localStorage.clear();
  useAuthStore.setState({
    token: null,
    user: null,
    initialized: false,
    loading: false,
    error: null,
  });
  vi.clearAllMocks();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authStore — initial state", () => {
  beforeEach(resetAll);

  it("starts with null token and user", () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("starts uninitialized", () => {
    expect(useAuthStore.getState().initialized).toBe(false);
  });
});

describe("authStore — init()", () => {
  beforeEach(resetAll);
  afterEach(() => localStorage.clear());

  it("calls registerUser when localStorage has no token", async () => {
    const fakeToken = "sp_newtesttoken123456";
    const fakeUser = {
      id: "user-1",
      token: fakeToken,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    mockRegisterUser.mockResolvedValue({ token: fakeToken, userId: "user-1" });
    mockFetchMe.mockResolvedValue(fakeUser);

    await useAuthStore.getState().init();

    expect(mockRegisterUser).toHaveBeenCalledOnce();
    expect(localStorage.getItem("sp_user_token")).toBe(fakeToken);
  });

  it("skips registerUser and uses existing token from localStorage", async () => {
    const existingToken = "sp_existingtoken123456";
    localStorage.setItem("sp_user_token", existingToken);
    const fakeUser = {
      id: "user-2",
      token: existingToken,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    mockFetchMe.mockResolvedValue(fakeUser);

    await useAuthStore.getState().init();

    expect(mockRegisterUser).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe(existingToken);
  });

  it("sets initialized to true on success", async () => {
    const token = "sp_testtoken123456789";
    mockRegisterUser.mockResolvedValue({ token, userId: "u1" });
    mockFetchMe.mockResolvedValue({
      id: "u1",
      token,
      createdAt: "",
      lastSeenAt: "",
    });

    await useAuthStore.getState().init();

    expect(useAuthStore.getState().initialized).toBe(true);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("sets error state when registration fails", async () => {
    mockRegisterUser.mockRejectedValue(new Error("Network error"));

    await useAuthStore.getState().init();

    expect(useAuthStore.getState().error).toBeTruthy();
    expect(useAuthStore.getState().initialized).toBe(true);
  });
});

describe("authStore — logout()", () => {
  beforeEach(resetAll);

  it("clears token, user, and localStorage", async () => {
    // Arrange: set an authenticated state
    const token = "sp_logouttest1234567890";
    localStorage.setItem("sp_user_token", token);
    useAuthStore.setState({
      token,
      user: {
        id: "u1",
        token,
        createdAt: "",
        lastSeenAt: "",
        _count: { configurations: 0 },
      },
      initialized: true,
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("sp_user_token")).toBeNull();
  });
});
