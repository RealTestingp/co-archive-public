import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../authConfig";
import styles from "./LoginPage.module.css";

const MicrosoftLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 21 21"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

function LoginPage() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  if (inProgress !== InteractionStatus.None) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkText}>Calgary Opera Archive</span>
          <div className={styles.wordmarkAccent} />
        </div>

        <div className={styles.divider} />

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>
          Sign in with your Calgary Opera Microsoft account to continue.
        </p>

        <button className={styles.msButton} onClick={handleLogin}>
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>

        <p className={styles.footer}>
          Access is restricted to Calgary Opera staff.
          <br />
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
