// Single source of truth for the current user.
//
// TEMP (demo build): EntraID is down, so this is a tiny localStorage-backed
// session store instead of a hardcoded constant. /login writes to it, NavBar's
// "Sign out" clears it, and useSyncExternalStore makes every consumer
// re-render the moment the role changes — no page reload needed.
//
// When Jenna re-enables EntraID: delete DEMO_USERS/signIn/signOut, point
// useSession() at the MSAL account, and keep useAuth()'s signature identical.

import { useSyncExternalStore } from "react";

export interface AuthUser {
  name: string;
  email: string;
  isAdmin: boolean;
}

export type DemoRole = "admin" | "user";

export const DEMO_USERS: Record<DemoRole, AuthUser> = {
  admin: {
    name: "Aurora Choban",
    email: "aurora.choban@calgaryopera.com",
    isAdmin: true,
  },
  user: {
    name: "Verity Boyd",
    email: "verity.boyd@calgaryopera.com",
    isAdmin: false,
  },
};

const STORAGE_KEY = "coa.demo-session";

const read = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed?.name !== "string") return null;
    return {
      name: parsed.name,
      email: parsed.email ?? "",
      isAdmin: !!parsed.isAdmin,
    };
  } catch {
    return null;
  }
};

let current: AuthUser | null = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Keeps a second tab/window in sync — handy if you demo user and admin
// side by side.
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY) return;
  current = read();
  emit();
});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => current;

export const signIn = (role: DemoRole): AuthUser => {
  current = DEMO_USERS[role];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  emit();
  return current;
};

export const signOut = () => {
  current = null;
  localStorage.removeItem(STORAGE_KEY);
  emit();
};

// null when signed out — use this for route guards.
export const useSession = (): AuthUser | null =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const GUEST: AuthUser = { name: "Guest", email: "", isAdmin: false };

// Never null — use this inside protected UI that assumes a user exists.
export const useAuth = (): AuthUser => useSession() ?? GUEST;