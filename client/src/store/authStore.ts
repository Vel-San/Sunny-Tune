import { create } from "zustand";
import { fetchMe, registerUser } from "../api";
import type { UserRecord } from "../types/config";

interface AuthState {
  token: string | null;
  user: UserRecord | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,
  loading: false,
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
      // If the stored token is rejected, clear it and retry once
      const hadToken = !!localStorage.getItem("sp_user_token");
      if (hadToken) {
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
}));
