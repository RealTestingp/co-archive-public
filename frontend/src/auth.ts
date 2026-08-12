/* auth.ts
   Single source of truth for who is signed in — backed by MSAL/Entra ID.

   useSession() reads the active MSAL account. useAuth() never returns null,
   for UI that already sits behind a route guard and can assume a user exists.

   Role comes from the "roles" claim on the ID token, set up via App Roles in
   the Entra app registration (Admin / Staff). isAdmin just checks for "Admin"
   in that claim.
*/

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import type { AccountInfo } from "@azure/msal-browser";

export interface AuthUser {
  name: string;
  email: string;
  isAdmin: boolean;
}

const toAuthUser = (account: AccountInfo): AuthUser => {
  const roles = (account.idTokenClaims?.roles as string[] | undefined) ?? [];

  return {
    name: account.name ?? account.username,
    email: account.username,
    isAdmin: roles.includes("Admin"),
  };
};

/* Two hooks on purpose, so callers do not have to null check everywhere.
   useSession returns null when signed out, which is what route guards need. */
export const useSession = (): AuthUser | null => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();

  if (!isAuthenticated || accounts.length === 0) return null;

  return toAuthUser(accounts[0]);
};

const GUEST: AuthUser = { name: "Guest", email: "", isAdmin: false };

/* useAuth is never null, for UI that already sits behind a guard and can assume
   a user exists. The guest fallback is only there to satisfy the type. */
export const useAuth = (): AuthUser => useSession() ?? GUEST;
