import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationsContext";

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
  const { isDark, colors } = useTheme();
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

  // ── Theme tokens ──
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";
  const hoverBg = isDark ? "#242424" : "#f9fafb";

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
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          border: "none",
          background: open ? hoverBg : "transparent",
          color: textSecondary,
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

        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              minWidth: "15px",
              height: "15px",
              padding: "0 4px",
              boxSizing: "border-box",
              borderRadius: "8px",
              background: "#9B1C1C",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 600,
              lineHeight: "15px",
              textAlign: "center",
              border: `2px solid ${colors.background}`,
              pointerEvents: "none",
            }}
          >
            {count > 9 ? "9+" : count}
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
            width: "340px",
            maxHeight: "420px",
            overflowY: "auto",
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: "10px",
            boxShadow: isDark
              ? "0 8px 28px rgba(0,0,0,0.5)"
              : "0 8px 28px rgba(0,0,0,0.12)",
            zIndex: 100,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: tableBg,
              borderBottom: `1px solid ${border}`,
              position: "sticky",
              top: 0,
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: textMuted,
              }}
            >
              Milestones
            </span>
            {count > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#9B1C1C",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "Inter, sans-serif",
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
                fontSize: "13px",
                color: textMuted,
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
                  padding: "12px 16px",
                  borderBottom:
                    i < items.length - 1 ? `1px solid ${borderLight}` : "none",
                }}
              >
                {/* Milestone count badge */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: isDark ? "#2a1414" : "#fef2f2",
                    border: `1px solid ${isDark ? "#4a2020" : "#fecaca"}`,
                    color: "#9B1C1C",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {n.milestoneCount}
                </div>

                {/* Body */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: textPrimary,
                      marginBottom: "2px",
                    }}
                  >
                    {n.person.firstName} {n.person.lastName}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: textSecondary,
                      lineHeight: 1.4,
                      marginBottom: "4px",
                    }}
                  >
                    {n.message}
                  </div>
                  <div style={{ fontSize: "11px", color: textMuted }}>
                    {n.milestoneType} · {relativeTime(n.createdAt)}
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
                    color: textMuted,
                    cursor: "pointer",
                    fontSize: "15px",
                    lineHeight: 1,
                    padding: "2px 4px",
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