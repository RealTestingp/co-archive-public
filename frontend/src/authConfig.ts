/* authConfig.ts
   Microsoft Entra ID settings for MSAL.

   Currently configured but not in use. The login screen's Microsoft button is
   disabled and the live session comes from the temporary store in auth.ts. See
   the comments there.

   On the environment variables: anything prefixed VITE_ is compiled into the
   JavaScript bundle at build time, so it is readable by anyone who opens the
   browser tools. That is fine here, and worth understanding rather than
   assuming it is a mistake. A client id and tenant id are public identifiers,
   not secrets. A browser app cannot keep a secret, which is exactly why the
   authorization code flow with PKCE exists: it proves the request came from the
   same client that started it, with no client secret involved.

   cacheLocation is sessionStorage rather than localStorage, so the session ends
   when the tab closes. Shorter lived, and safer on a shared machine, at the
   cost of signing in again on each new session.
*/
import type { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const loginRequest: PopupRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    `api://${import.meta.env.VITE_ENTRA_CLIENT_ID}/access_as_user`,
  ],
};
