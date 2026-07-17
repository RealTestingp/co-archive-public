import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationsContext";
import type { AppNotification } from "../context/NotificationsContext";

// "Today" / "Tomorrow" / weekday label for a milestone date.
const relativeLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(d) - startOfDay(today)) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString("en-CA", { weekday: "long" });
};

const fullDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

const NotificationBell = () => {
  const { isDark, colors } = useTheme();
  const navigate = useNavigate();
  const { items, count } = useNotifications();
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

  // ── Theme tokens (match ProductionPage / ManageArchive) ──
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";
  const hoverBg = isDark ? "#242424" : "#f9fafb";

  const handleGo = (n: AppNotification) => {
    setOpen(false);
    navigate(`/productions/${n.productionId}`);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={
          count > 0 ? `Notifications, ${count} upcoming` : "Notifications"
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
              top: "3px",
              right: "3px",
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              boxSizing: "border-box",
              borderRadius: "8px",
              background: "#9B1C1C",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 600,
              lineHeight: "16px",
              textAlign: "center",
              border: `1.5px solid ${colors.background}`,
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
            width: "320px",
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
              Upcoming this week
            </span>
            {count > 0 && (
              <span style={{ fontSize: "11px", color: textMuted }}>
                {count} item{count !== 1 ? "s" : ""}
              </span>
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
              Nothing upcoming this week.
            </div>
          ) : (
            items.map((n, i) => (
              <div
                key={n.id}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleGo(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleGo(n);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom:
                    i < items.length - 1 ? `1px solid ${borderLight}` : "none",
                  outline: "none",
                }}
              >
                {/* Date pill */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    padding: "6px 0",
                    borderRadius: "6px",
                    background: isDark ? "#2a1414" : "#fef2f2",
                    border: `1px solid ${isDark ? "#4a2020" : "#fecaca"}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#9B1C1C",
                    }}
                  >
                    {new Date(n.date).toLocaleDateString("en-CA", {
                      month: "short",
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#9B1C1C",
                      lineHeight: 1.1,
                    }}
                  >
                    {new Date(n.date).getDate()}
                  </span>
                </div>

                {/* Body */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: textPrimary,
                      marginBottom: "2px",
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ fontSize: "11px", color: textSecondary }}>
                    {relativeLabel(n.date)} · {fullDate(n.date)}
                    {n.eventType ? ` · ${n.eventType}` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;