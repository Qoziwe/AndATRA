import { create } from "zustand";

import { fetchCurrentUser, login as loginRequest } from "@/services/auth";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type AuthSession,
  type AuthUser
} from "@/services/authSession";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  isAuthenticating: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: (session: AuthSession | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  isAuthenticating: false,
  hydrate: async () => {
    const session = loadAuthSession();
    if (!session) {
      set({ token: null, user: null, hydrated: true });
      return;
    }

    set({
      token: session.accessToken,
      user: session.user,
      hydrated: false
    });

    try {
      const user = await fetchCurrentUser();
      const nextSession = { accessToken: session.accessToken, user };
      saveAuthSession(nextSession);
      set({
        token: nextSession.accessToken,
        user: nextSession.user,
        hydrated: true
      });
    } catch {
      clearAuthSession();
      set({ token: null, user: null, hydrated: true });
    }
  },
  login: async (username, password) => {
    set({ isAuthenticating: true });
    try {
      const session = await loginRequest(username, password);
      saveAuthSession(session);
      set({
        token: session.accessToken,
        user: session.user,
        hydrated: true,
        isAuthenticating: false
      });
    } catch (error) {
      set({ isAuthenticating: false });
      throw error;
    }
  },
  logout: () => {
    clearAuthSession();
    set({ token: null, user: null, hydrated: true, isAuthenticating: false });
  },
  restoreSession: (session) => {
    if (!session) {
      set({ token: null, user: null, hydrated: true });
      return;
    }

    set({ token: session.accessToken, user: session.user, hydrated: true });
  }
}));
