import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import styles from "./NavBar.module.css";

const NavBar = () => {
  const { pathname } = useLocation();
  const { instance, accounts } = useMsal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const account = accounts[0];
  const name = account?.name ?? "";
  const email = account?.username ?? "";
  const isAdmin = (account?.idTokenClaims as any)?.roles?.includes("Admin") ?? false;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path: string) =>
    pathname.startsWith(path) || (pathname === "/" && path === "/search");

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Link to="/" className={styles.brandLink}>
          CALGARY OPERA <span className={styles.brandAccent}>ARCHIVE</span>
        </Link>
      </div>

      <div className={styles.links}>
        <Link to="/search" className={`${styles.link} ${isActive("/search") ? styles.linkActive : ""}`}>
          Search
        </Link>
        <Link to="/dashboard" className={`${styles.link} ${isActive("/dashboard") ? styles.linkActive : ""}`}>
          Dashboard
        </Link>
        <Link to="/reports" className={`${styles.link} ${isActive("/reports") ? styles.linkActive : ""}`}>
          Reports
        </Link>
      </div>

      <div className={styles.right}>
        {isAdmin && <div className={styles.adminBadge}>Admin</div>}

        <div className={styles.avatarWrap} ref={dropdownRef}>
          <button
            className={styles.avatar}
            onClick={() => setDropdownOpen((o) => !o)}
            aria-label="Open profile menu"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownName}>{name}</div>
                <div className={styles.dropdownEmail}>{email}</div>
              </div>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;