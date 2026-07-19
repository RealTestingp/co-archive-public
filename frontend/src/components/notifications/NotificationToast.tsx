import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationsContext";

// ISO week key like "2026-W29" so the toast shows at most once per week.
const isoWeekKey = (d = new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const STORAGE_PREFIX = "coa_week_toast_";
const AUTO_DISMISS_MS = 9000;

const NotificationToast = () => {
  const { isDark, colors } = useTheme();
  const { items, count, loading } = useNotifications();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false); // drives slide-in transition

  useEffect(() => {
    if (loading || count === 0) return;

    const key = `${STORAGE_PREFIX}${isoWeekKey()}`;
    let seen = false;
    try {
      seen = localStorage.getItem(key) === "1";
    } catch {
      // localStorage unavailable (private mode); just show it this session.
    }
    if (seen) return;

    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }

    setShow(true);
    requestAnimationFrame(() => setMounted(true));
    const t = setTimeout(() => handleClose(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, count]);

  const handleClose = () => {
    setMounted(false);
    setTimeout(() => setShow(false), 250); // wait for slide-out
  };

  if (!show) return null;

  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";

  const preview = items.slice(0, 3);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        // Top-right, just below the 52px navbar — sits under the bell it came
        // from and clears the chat widget's column entirely (bubble + panel).
        top: "68px",
        right: "24px",
        width: "320px",
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: "12px",
        boxShadow: isDark
          ? "0 10px 34px rgba(0,0,0,0.55)"
          : "0 10px 34px rgba(0,0,0,0.15)",
        padding: "16px",
        zIndex: 1000,
        fontFamily: "Inter, sans-serif",
        transform: mounted ? "translateY(0)" : "translateY(-12px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.25s ease, opacity 0.25s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: preview.length ? "12px" : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9B1C1C"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            style={{ fontSize: "13px", fontWeight: 600, color: textPrimary }}
          >
            {count} milestone{count !== 1 ? "s" : ""} to review
          </span>
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss"
          style={{
            border: "none",
            background: "transparent",
            color: textMuted,
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Preview list */}
      {preview.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "baseline",
            fontSize: "12px",
            color: textSecondary,
            marginBottom: "6px",
          }}
        >
          <span
            style={{ fontWeight: 600, color: "#9B1C1C", whiteSpace: "nowrap" }}
          >
            {n.milestoneCount}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {n.person.firstName} {n.person.lastName} — {n.milestoneType}
          </span>
        </div>
      ))}

      {count > preview.length && (
        <div style={{ fontSize: "11px", color: textMuted, marginTop: "4px" }}>
          + {count - preview.length} more — open the bell to see all.
        </div>
      )}
    </div>
  );
};

export default NotificationToast;