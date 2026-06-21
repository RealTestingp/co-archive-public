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
  scopes: ["openid", "profile", "email"],
};
