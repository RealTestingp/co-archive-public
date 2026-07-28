import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications, ordinal } from "../../context/NotificationsContext";

/* ============================================================================
   NOTIFICATION BELL

   Two bugs fixed here:

   1. BADGE DIDN'T MATCH THE LIST. The badge read `count > 9 ? "9+" : count`,
      so with 12 unread the badge said "9+", the panel listed 12 rows, and the
      toast header said "12 milestones" — three different numbers for one
      state. A 9 cap is far too low for an archive that backfills decades of
      history. Now the real number shows up to 99.

   2. THE CIRCLED NUMBER WASN'T A COUNT. It's `milestoneCount` — the milestone
      being celebrated (a 50th performance). It sat in a red circle styled
      almost identically to the unread badge, so the same visual language meant
      two different things. It's now a neutral pill reading "50th", with the
      type spelled out beside it. That also pulls red off every single row,
      which is where most of the 10% budget was going on this panel.

   Type: --fs-xs (12px) and --fs-sm (16px) only. Colours all from tokens.
   ========================================================================== */

// "just now" / "3h ago" / "2d ago" / date for anything older than a week.
const relativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
};

const NotificationBell = () => {
  const { colors, type, weight } = useTheme();
  const { items, count, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={
          count > 0 ? `Notifications, ${count} unread` : "Notifications"
        }
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-lg)",
          border: "none",
          background: open ? colors.surfaceHover : "transparent",
          color: colors.inkMuted,
          cursor: "pointer",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread count — the ONE red counter in the notification UI, and the
            only number that should ever mean "how many". Caps at 99 so it
            agrees with the panel and the toast for any realistic backlog. */}
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              padding: "0 5px",
              boxSizing: "border-box",
              borderRadius: "var(--radius-pill)",
              background: colors.brand,
              color: colors.brandOn,
              fontSize: type.xs,
              fontWeight: weight.semibold,
              lineHeight: "18px",
              textAlign: "center",
              border: `2px solid ${colors.bg}`,
              pointerEvents: "none",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            maxWidth: "calc(100vw - 2rem)",
            maxHeight: "440px",
            overflowY: "auto",
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-overlay)",
            zIndex: 100,
            fontFamily: "var(--font-sans)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "12px 16px",
              background: colors.surface,
              borderBottom: `1px solid ${colors.border}`,
              position: "sticky",
              top: 0,
            }}
          >
            <span
              style={{
                fontSize: type.xs,
                fontWeight: weight.semibold,
                textTransform: "uppercase",
                letterSpacing: "var(--ls-wide)",
                color: colors.inkMuted,
              }}
            >
              Milestones
            </span>
            {/* Action link — ink, not red. */}
            {count > 0 && (
              <button
                onClick={() => markAllAsRead()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
                style={{
                  fontSize: type.xs,
                  fontWeight: weight.semibold,
                  color: colors.ink,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "var(--font-sans)",
                  whiteSpace: "nowrap",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div
              style={{
                padding: "2rem 16px",
                textAlign: "center",
                fontSize: type.sm,
                color: colors.inkMuted,
              }}
            >
              You're all caught up.
            </div>
          ) : (
            items.map((n, i) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "14px 16px",
                  borderBottom:
                    i < items.length - 1
                      ? `1px solid ${colors.borderSubtle}`
                      : "none",
                }}
              >
                {/* Milestone marker. NEUTRAL on purpose — a red circle here is
                    the same visual language as the unread badge above, and
                    these two numbers mean completely different things. The
                    ordinal ("50th") also stops it reading as a quantity. */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "42px",
                    height: "42px",
                    padding: "0 6px",
                    boxSizing: "border-box",
                    borderRadius: "var(--radius-pill)",
                    background: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.ink,
                    fontSize: type.xs,
                    fontWeight: weight.semibold,
                  }}
                >
                  {ordinal(n.milestoneCount)}
                </div>

                {/* Body */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: type.sm,
                      fontWeight: weight.semibold,
                      color: colors.ink,
                      marginBottom: "2px",
                      overflowWrap: "break-word",
                    }}
                  >
                    {n.person.firstName} {n.person.lastName}
                  </div>
                  <div
                    style={{
                      fontSize: type.sm,
                      fontWeight: weight.regular,
                      color: colors.inkMuted,
                      lineHeight: 1.4,
                      marginBottom: "4px",
                      overflowWrap: "break-word",
                    }}
                  >
                    {n.message}
                  </div>
                  {/* Spells out what the pill means, so the number is never
                      ambiguous on its own. */}
                  <div style={{ fontSize: type.xs, color: colors.inkMuted }}>
                    {ordinal(n.milestoneCount)} {n.milestoneType} ·{" "}
                    {relativeTime(n.createdAt)}
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => markAsRead(n.id)}
                  aria-label="Mark as read"
                  title="Mark as read"
                  style={{
                    flexShrink: 0,
                    border: "none",
                    background: "transparent",
                    color: colors.inkMuted,
                    cursor: "pointer",
                    fontSize: type.sm,
                    lineHeight: 1,
                    minWidth: "32px",
                    minHeight: "32px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;