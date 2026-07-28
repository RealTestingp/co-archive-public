/* auth.ts
   Single source of truth for who is signed in.

   TEMPORARY. Entra ID was unavailable while we were finishing the build, so
   this is a small session store backed by localStorage instead of the real
   identity provider. What that means in practice:
   - Two fixed users, one admin and one standard, picked on the login screen
   - No credential check, no token, and no proof of identity sent to the backend
   - The route guards below are UI level only, they do not secure anything

   Why it is built this way rather than a hardcoded constant: useSyncExternalStore
   lets every component re-render the moment the role changes, so switching
   between admin and user in the demo needs no page reload.

   Swapping Entra back in: delete DEMO_USERS, signIn and signOut, point
   useSession() at the MSAL account, and leave useAuth()'s signature alone. The
   rest of the app only touches those two hooks, so nothing else has to change.
*/

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

/* Reads the stored session back out. Wrapped in try/catch and shape checked
   because localStorage is just a string, so anything could be in there if a key
   collides or an old format is left over. Returning null on bad data means the
   user gets sent to login rather than the app crashing. */
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

/* The store: current value, a set of subscribers, and a way to tell them it
   changed. This is the minimum useSyncExternalStore needs. */
let current: AuthUser | null = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* Keeps a second tab in sync. The storage event only fires in other tabs, not
   the one that made the change, which is exactly what we want here. Useful for
   demoing admin and user side by side. */
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

/* Two hooks on purpose, so callers do not have to null check everywhere.
   useSession returns null when signed out, which is what route guards need. */
export const useSession = (): AuthUser | null =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const GUEST: AuthUser = { name: "Guest", email: "", isAdmin: false };

/* useAuth is never null, for UI that already sits behind a guard and can assume
   a user exists. The guest fallback is only there to satisfy the type. */
export const useAuth = (): AuthUser => useSession() ?? GUEST;