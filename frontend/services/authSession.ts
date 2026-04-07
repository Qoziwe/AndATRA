export interface AuthUser {
  username: string;
  display_name: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

const AUTH_STORAGE_KEY = "andatra.auth.session";

let inMemorySession: AuthSession | null = null;
const listeners = new Set<() => void>();

const canUseBrowserStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadAuthSession = (): AuthSession | null => {
  if (inMemorySession) {
    return inMemorySession;
  }

  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.username) {
      return null;
    }

    inMemorySession = parsed;
    return parsed;
  } catch {
    return null;
  }
};

export const saveAuthSession = (session: AuthSession | null) => {
  inMemorySession = session;

  if (!canUseBrowserStorage()) {
    listeners.forEach((listener) => listener());
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    listeners.forEach((listener) => listener());
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  listeners.forEach((listener) => listener());
};

export const clearAuthSession = () => {
  saveAuthSession(null);
};

export const getAccessToken = () => loadAuthSession()?.accessToken ?? null;

export const subscribeToAuthSession = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
