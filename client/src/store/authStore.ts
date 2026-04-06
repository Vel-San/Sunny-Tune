import { create } from "zustand";
import {
  ApiError,
  fetchMe,
  registerUser,
  revokeToken,
  updateUsername,
} from "../api";
import { log } from "../lib/logger";
import type { UserRecord } from "../types/config";

interface AuthState {
  token: string | null;
  user: UserRecord | null;
  initialized: boolean;
  loading: boolean;
  rerolling: boolean;
  importing: boolean;
  updatingUsername: boolean;
  error: string | null;
  init: () => Promise<void>;
  logout: () => void;
  rerollToken: () => Promise<void>;
  importToken: (pastedToken: string) => Promise<void>;
  updateUsername: (username: string | null) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,
  loading: false,
  rerolling: false,
  importing: false,
  updatingUsername: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      let token = localStorage.getItem("sp_user_token");
      if (!token) {
        const result = await registerUser();
        token = result.token;
        localStorage.setItem("sp_user_token", token);
      }
      const user = await fetchMe();
      set({ token, user, initialized: true, loading: false });
      log.info("Auth initialized");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      log.warn("Auth init failed", {
        msg,
        isApiError: err instanceof ApiError,
        status: err instanceof ApiError ? err.status : undefined,
      });
      // Only clear the token + re-register when the server explicitly rejects
      // it with a 401. A status of 0 means networking / server-restart — keep
      // the token so the user's data is still accessible once the server is up.
      const is401 = err instanceof ApiError && err.status === 401;
      const hadToken = !!localStorage.getItem("sp_user_token");
      if (hadToken && is401) {
        log.warn("Auth token rejected by server (401), re-registering");
        localStorage.removeItem("sp_user_token");
        try {
          const result = await registerUser();
          localStorage.setItem("sp_user_token", result.token);
          const user = await fetchMe();
          set({ token: result.token, user, initialized: true, loading: false });
          log.info("Re-registered new token after 401");
          return;
        } catch (reRegErr) {
          log.error("Re-registration failed", { err: String(reRegErr) });
          // fall through
        }
      }
      set({ error: msg, initialized: true, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("sp_user_token");
    set({ token: null, user: null, initialized: false });
  },

  rerollToken: async () => {
    set({ rerolling: true, error: null });
    try {
      const { token: newToken } = await revokeToken();
      localStorage.setItem("sp_user_token", newToken);
      set({ token: newToken, rerolling: false });
      log.info("Token revoked and re-issued");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to regenerate token";
      log.error("Token revoke failed", { err: msg });
      set({ error: msg, rerolling: false });
    }
  },

  importToken: async (pastedToken: string) => {
    const trimmed = pastedToken.trim();
    if (!trimmed) return;
    set({ importing: true, error: null });
    try {
      // Temporarily set the token so fetchMe uses it
      localStorage.setItem("sp_user_token", trimmed);
      const user = await fetchMe();
      set({ token: trimmed, user, importing: false });
      log.info("Token imported from paste");
    } catch (err) {
      // Revert — the pasted token was invalid
      const msg =
        err instanceof Error ? err.message : "Token not recognised by server";
      log.warn("Token import failed", { err: msg });
      // Restore the old token if there was one
      const old = localStorage.getItem("sp_user_token");
      if (old !== trimmed) localStorage.setItem("sp_user_token", old ?? "");
      else localStorage.removeItem("sp_user_token");
      set({ importing: false, error: `Invalid token: ${msg}` });
    }
  },

  updateUsername: async (username: string | null) => {
    set({ updatingUsername: true, error: null });
    try {
      const result = await updateUsername(username);
      set((state) => ({
        user: state.user
          ? { ...state.user, username: result.username }
          : state.user,
        updatingUsername: false,
      }));
      log.info("Username updated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update username";
      log.error("Username update failed", { err: msg });
      set({ error: msg, updatingUsername: false });
    }
  },
}));
