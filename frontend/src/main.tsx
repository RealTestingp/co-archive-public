/* main.tsx
   App entry point. Sets up MSAL, then mounts React inside the providers.

   Provider order matters. MsalProvider is outermost since auth is the widest
   concern, then ThemeProvider, then the app. */
import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);

/* This used to be a top level await, and it caused a bug that only showed up in
   the production build.

   Top level await makes this module async. Rollup then split shared modules
   across chunks and NotificationsContext ended up duplicated, so the provider
   and the hook were pointing at two different context objects. The lookup found
   nothing and the app threw "useNotifications must be used within a
   <NotificationsProvider>", even though it clearly was inside one. Dev mode was
   fine because Vite serves modules unbundled.

   Wrapping the await in a normal async function keeps the module graph
   synchronous, which stops the split. Do not move this await back to the top
   level. */
async function bootstrap() {
  await msalInstance.initialize();

  /* Deliberately not calling msalInstance.handleRedirectPromise() here.
     MsalProvider already calls it internally. Calling it twice races: the first
     call consumes the temporary cache entry the second one needs, and MSAL
     throws BrowserAuthError: no_token_request_cache_error. */

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MsalProvider>
    </React.StrictMode>,
  );
}

bootstrap();