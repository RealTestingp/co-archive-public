/* main.tsx
   App entry point. Sets up MSAL, then mounts React inside the providers.

   Provider order matters. MsalProvider is outermost since auth is the widest
   concern, then ThemeProvider, then the app.

   TEMPORARY: React.StrictMode removed to test whether its double-invocation
   behavior in dev is interfering with MSAL's internal handleRedirectPromise()
   call. Re-add once confirmed either way.
*/
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msalInstance";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import "./index.css";

async function bootstrap() {
  await msalInstance.initialize();

  /* Deliberately not calling msalInstance.handleRedirectPromise() here.
     MsalProvider already calls it internally. Calling it twice races: the first
     call consumes the temporary cache entry the second one needs, and MSAL
     throws BrowserAuthError: no_token_request_cache_error. */

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <MsalProvider instance={msalInstance}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MsalProvider>,
  );
}

bootstrap();
