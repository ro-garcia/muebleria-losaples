"use client";

import { useCallback, useSyncExternalStore } from "react";

const TOKEN_KEY = "shop_token";
const USER_KEY = "shop_user";
const SESSION_EVENT = "shop-session-updated";

export interface SessionUser {
  clienteId: number;
  username: string;
  correo: string;
  nombreCompleto: string;
}

interface SessionSnapshot {
  token: string;
  user: SessionUser | null;
  initialized: boolean;
}

const readStoredUser = (raw?: string | null): SessionUser | null => {
  if (typeof window === "undefined") return null;
  const value = raw ?? window.localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    return null;
  }
};

export const getSessionToken = () =>
  typeof window === "undefined" ? "" : window.localStorage.getItem(TOKEN_KEY) ?? "";

export const getSessionUser = () => readStoredUser();

export const setSession = (token: string, user: SessionUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
};

const SERVER_SESSION_SNAPSHOT: SessionSnapshot = {
  token: "",
  user: null as SessionUser | null,
  initialized: false,
};

let cachedClientSnapshot: SessionSnapshot = SERVER_SESSION_SNAPSHOT;
let cachedClientToken = "";
let cachedClientUserRaw: string | null = null;

const getSessionSnapshot = () => {
  if (typeof window === "undefined") {
    return SERVER_SESSION_SNAPSHOT;
  }

  const token = window.localStorage.getItem(TOKEN_KEY) ?? "";
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (
    cachedClientSnapshot.initialized &&
    cachedClientToken === token &&
    cachedClientUserRaw === rawUser
  ) {
    return cachedClientSnapshot;
  }

  cachedClientToken = token;
  cachedClientUserRaw = rawUser;
  cachedClientSnapshot = {
    token,
    user: readStoredUser(rawUser),
    initialized: true,
  };

  return cachedClientSnapshot;
};

const getServerSessionSnapshot = () => SERVER_SESSION_SNAPSHOT;

const subscribeToSession = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === TOKEN_KEY || event.key === USER_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener(SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
};

export const useSession = () => {
  const { token, user, initialized } = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const saveSession = useCallback((nextToken: string, nextUser: SessionUser) => {
    setSession(nextToken, nextUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    initialized,
    saveSession,
    logout,
  };
};
