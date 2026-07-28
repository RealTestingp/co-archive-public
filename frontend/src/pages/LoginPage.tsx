import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { signIn, useSession, DEMO_USERS, type DemoRole } from "../auth";
import styles from "./LoginPage.module.css";

/* ============================================================================
   TEMPORARY DEMO LOGIN

   EntraID is unavailable, so this screen stands in for it. The Microsoft
   button is kept (disabled) so the real sign-in path is still visible in the
   demo, and the role picker below it decides which identity the session gets.
   Credentials are not validated — any values submit.

   Delete this file's role picker and re-enable the Microsoft button once
   EntraID is back.
   ========================================================================== */

const MicrosoftMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="0" y="0" width="7" height="7" fill="#F25022" />
    <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
    <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
    <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
  </svg>
);

const ROLE_LABEL: Record<DemoRole, string> = {
  user: "Archive user",
  admin: "Administrator",
};

const LoginPage = () => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: { pathname?: string } };
  };

  const [role, setRole] = useState<DemoRole>("admin");
  const [email, setEmail] = useState(DEMO_USERS.admin.email);
  const [password, setPassword] = useState("demo1234");

  // Already signed in — don't show the form again.
  if (session) return <Navigate to="/search" replace />;

  const chooseRole = (r: DemoRole) => {
    setRole(r);
    setEmail(DEMO_USERS[r].email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(role);
    navigate(location.state?.from?.pathname ?? "/search", { replace: true });
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
          Single sign-on is temporarily unavailable. Use archive credentials to
          continue.
        </p>

        <button type="button" className={styles.msButton} disabled>
          <MicrosoftMark />
          Sign in with Microsoft
          <span className={styles.msStatus}>Unavailable</span>
        </button>

        <div className={styles.orRow}>
          <span className={styles.orLine} />
          <span className={styles.orText}>or</span>
          <span className={styles.orLine} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Sign in as</span>
            <div className={styles.roleGroup} role="group">
              {(["user", "admin"] as DemoRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => chooseRole(r)}
                  aria-pressed={role === r}
                  className={`${styles.roleBtn} ${
                    role === r ? styles.roleBtnActive : ""
                  }`}
                >
                  <span className={styles.roleName}>{ROLE_LABEL[r]}</span>
                  <span className={styles.roleMeta}>{DEMO_USERS[r].name}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submit}>
            Continue
          </button>
        </form>

        <div className={styles.divider} />
        <p className={styles.footer}>
          Temporary access while Microsoft sign-in is restored.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;