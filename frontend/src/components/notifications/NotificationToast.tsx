import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications, ordinal } from "../../context/NotificationsContext";

/* ============================================================================
   WEEKLY MILESTONE TOAST

   THE MYSTERY NUMBER: each preview row used to lead with a bare bold
   `{n.milestoneCount}` — "50 Jane Doe — Performance". That number is the
   milestone being celebrated (a 50th performance), not a count of anything,
   but sitting alone in bold ahead of a name it reads like a counter and gets
   confused with the unread badge on the bell. (The old code comment even
   called it an "Inline count", which is how the confusion started.)

   It now reads "Jane Doe — 50th Performance": the number carries its unit and
   its noun, so there is exactly one number in this component that means
   "how many", and it's the one in the header.

   Type: --fs-xs (12px) and --fs-sm (16px) only. Colours all from tokens.
   ========================================================================== */

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
  const { colors, type, weight } = useTheme();
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

  const preview = items.slice(0, 3);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        // Top-right, just below the navbar — sits under the bell it came from
        // and clears the chat widget's column entirely (bubble + panel).
        top: "68px",
        right: "24px",
        width: "360px",
        // Never wider than the viewport on a phone.
        maxWidth: "calc(100vw - 2rem)",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-overlay)",
        padding: "16px",
        zIndex: 1000,
        fontFamily: "var(--font-sans)",
        transform: mounted ? "translateY(0)" : "translateY(-12px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.25s ease, opacity 0.25s ease",
      }}
    >
      {/* Header — the only "how many" number in this component. */}
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
          {/* Header bell icon — decorative accent, kept red. */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.brandText}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            style={{
              fontSize: type.sm,
              fontWeight: weight.semibold,
              color: colors.ink,
            }}
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
            color: colors.inkMuted,
            cursor: "pointer",
            fontSize: type.sm,
            lineHeight: 1,
            flexShrink: 0,
            minWidth: "28px",
            minHeight: "28px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          ×
        </button>
      </div>

      {/* Preview list. Name first, then the milestone with its unit attached —
          no bare leading number to be mistaken for a count. */}
      {preview.map((n) => (
        <div
          key={n.id}
          style={{
            fontSize: type.sm,
            fontWeight: weight.regular,
            color: colors.inkMuted,
            marginBottom: "6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontWeight: weight.semibold, color: colors.ink }}>
            {n.person.firstName} {n.person.lastName}
          </span>
          {" — "}
          {ordinal(n.milestoneCount)} {n.milestoneType}
        </div>
      ))}

      {count > preview.length && (
        <div
          style={{
            fontSize: type.xs,
            color: colors.inkMuted,
            marginTop: "4px",
          }}
        >
          + {count - preview.length} more — open the bell to see all.
        </div>
      )}
    </div>
  );
};

export default NotificationToast;