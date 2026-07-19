// Single source of truth for the current user.
//
// EntraID is temporarily disabled, so this returns a mock user. When Jenna
// re-enables auth, swap the body of useAuth() to read the real identity —
// every consumer (NavBar, page-level admin gating, AdminRoute) picks it up
// without further changes.

export interface AuthUser {
  name: string;
  email: string;
  isAdmin: boolean;
}

// ── TEMP: mock auth while EntraID is disabled ──────────────────────────────
const MOCK_USER: AuthUser = {
  name: "Aurora Choban",
  email: "aurora.choban@calgaryopera.com",
  isAdmin: true,
};
// ──────────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthUser => MOCK_USER;