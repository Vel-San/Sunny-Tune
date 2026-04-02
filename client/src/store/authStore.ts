import { create } from "zustand";
import { ApiError, fetchMe, registerUser, revokeToken } from "../api";
import type { UserRecord } from "../types/config";

interface AuthState {
  token: string | null;
  user: UserRecord | null;
  initialized: boolean;
  loading: boolean;
  rerolling: boolean;
  error: string | null;
  init: () => Promise<void>;
  logout: () => void;
  rerollToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,
  loading: false,
  rerolling: false,
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      // Only clear the token + re-register when the server explicitly rejects
      // it with a 401. A status of 0 means networking / server-restart — keep
      // the token so the user's data is still accessible once the server is up.
      const is401 = err instanceof ApiError && err.status === 401;
      const hadToken = !!localStorage.getItem("sp_user_token");
      if (hadToken && is401) {
        localStorage.removeItem("sp_user_token");
        try {
          const result = await registerUser();
          localStorage.setItem("sp_user_token", result.token);
          const user = await fetchMe();
          set({ token: result.token, user, initialized: true, loading: false });
          return;
        } catch {
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
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to regenerate token";
      set({ error: msg, rerolling: false });
    }
  },
}));
