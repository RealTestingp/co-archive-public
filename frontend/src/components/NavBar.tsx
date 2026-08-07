/* NavBar.tsx
   The top bar on every page except login: navigation, the notification bell,
   the theme toggle and the user menu.

   Manage Archive only renders for admins. That is presentation, not protection.
   The route itself is guarded by AdminRoute, and the real enforcement has to be
   on the backend. Hiding the link means ordinary users never see a door they
   cannot open, which is a better experience than a permission error.

   useLocation drives the active link styling, so the highlight follows the real
   URL rather than being tracked separately, and it stays correct after a back
   navigation or a direct link.

   Sign out calls MSAL's logoutRedirect, which clears the session and redirects
   to /login on its own (postLogoutRedirectUri is set in authConfig.ts) — no
   manual navigate() call needed here.
*/
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth";
import NotificationBell from "./notifications/NotificationBell";
import styles from "./NavBar.module.css";

// Small icons for the appearance options.
const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ marginLeft: "auto" }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { mode, setMode } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { name, email, isAdmin } = useAuth();

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path: string) => pathname.startsWith(path);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/login",
    });
  };

  // Three appearance choices, current one gets a checkmark.
  const themeOptions: {
    value: "light" | "dark" | "system";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: <SystemIcon /> },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
        <Link
          to="/search"
          data-text="Search"
          className={`${styles.link} ${isActive("/search") ? styles.linkActive : ""}`}
        >
          Search
        </Link>
        <Link
          to="/reports"
          data-text="Reports"
          className={`${styles.link} ${isActive("/reports") ? styles.linkActive : ""}`}
        >
          Reports
        </Link>
        {isAdmin && (
          <Link
            to="/manage"
            data-text="Manage Archive"
            className={`${styles.link} ${isActive("/manage") ? styles.linkActive : ""}`}
          >
            Manage Archive
          </Link>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.searchWrap}>
          <div className={styles.searchInputWrap}>
            <svg
              className={styles.searchIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              aria-label="Search archive"
            />
          </div>
          <Link
            to="/search"
            className={styles.searchIconBtn}
            aria-label="Go to search"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </div>

        {isAdmin && <div className={styles.adminBadge}>Admin</div>}

        <NotificationBell />

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

              {/* Appearance — three explicit choices, current one checked.
                  "System" follows the OS automatically. Inline-styled so it
                  needs no CSS-module addition; opacity adapts to either theme. */}
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.5,
                }}
              >
                Appearance
              </div>
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={styles.dropdownItem}
                  onClick={() => setMode(opt.value)}
                  aria-pressed={mode === opt.value}
                >
                  {opt.icon}
                  {opt.label}
                  {mode === opt.value && <CheckIcon />}
                </button>
              ))}

              <button className={styles.dropdownItem} onClick={handleLogout}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
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
