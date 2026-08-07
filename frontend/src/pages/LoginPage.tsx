import { Navigate, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useSession } from "../auth";
import { loginRequest } from "../authConfig";
import styles from "./LoginPage.module.css";

const MicrosoftMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="0" y="0" width="7" height="7" fill="#F25022" />
    <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
    <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
    <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
  </svg>
);

const LoginPage = () => {
  const session = useSession();
  const { instance } = useMsal();
  const location = useLocation() as {
    state?: { from?: { pathname?: string } };
  };

  // Already signed in — don't show the login screen again.
  if (session) return <Navigate to="/search" replace />;

  const handleLogin = () => {
    instance.loginRedirect({
      ...loginRequest,
      state: location.state?.from?.pathname ?? "/search",
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkText}>Calgary Opera Archive</span>
          <span className={styles.wordmarkAccent} />
        </div>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.subheading}>
          Sign in with your Calgary Opera Microsoft account to continue.
        </p>

        <button type="button" className={styles.msButton} onClick={handleLogin}>
          <MicrosoftMark />
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
