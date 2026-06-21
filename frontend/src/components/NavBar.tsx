import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./NavBar.module.css";

// ── TEMP: mock auth while EntraID is disabled ──────────────────────────────
const MOCK_USER = {
  name: "Aurora Choban",
  email: "aurora.choban@calgaryopera.com",
  isAdmin: true, // toggle to false to test regular user view
};
// ──────────────────────────────────────────────────────────────────────────

const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { name, email, isAdmin } = MOCK_USER;

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
    // TODO: re-enable when EntraID is back
    // instance.logoutRedirect();
    console.log("logout");
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
        <Link
          to="/search"
          className={`${styles.link} ${isActive("/search") ? styles.linkActive : ""}`}
        >
          Search
        </Link>
        <Link
          to="/reports"
          className={`${styles.link} ${isActive("/reports") ? styles.linkActive : ""}`}
        >
          Reports
        </Link>
        {isAdmin && (
          <Link
            to="/manage"
            className={`${styles.link} ${isActive("/manage") ? styles.linkActive : ""}`}
          >
            Manage Archive
          </Link>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.searchWrap}>
          <div className={styles.searchInputWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <Link to="/search" className={styles.searchIconBtn} aria-label="Go to search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </div>

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