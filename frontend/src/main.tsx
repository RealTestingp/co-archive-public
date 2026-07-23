import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import "./index.css";

const msalInstance = new PublicClientApplication(msalConfig);

// NOTE: this used to use top-level `await`, which makes this entry an async
// module. Under the production build that let Rollup split shared modules
// across chunks — producing two copies of NotificationsContext, so the
// provider and the hook ended up with different React contexts and threw
// "useNotifications must be used within a <NotificationsProvider>".
// Initialising inside an async bootstrap keeps the module graph synchronous.
async function bootstrap() {
  await msalInstance.initialize();

  // Note: we intentionally do NOT call msalInstance.handleRedirectPromise()
  // here. MsalProvider already calls it internally — calling it a second
  // time here causes a race where the first call consumes the temporary
  // cache entry MSAL needs, and the second (inside MsalProvider) throws
  // BrowserAuthError: no_token_request_cache_error.

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
