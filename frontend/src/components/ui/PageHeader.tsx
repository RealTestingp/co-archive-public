/* PageHeader.tsx
   The title block at the top of every detail page: title, subtitle, and the
   Edit, Delete and View History actions.

   Shared so the three detail pages cannot drift apart in spacing, type size or
   button order. Fixing the header once fixes it everywhere.

   The handler-driven rendering below is the part worth knowing: passing a
   handler shows the button, omitting it hides the button. That is also how the
   pages gate admin actions, by passing onEdit and onDelete only when the user
   is an admin, so there is no separate permission prop to keep in sync.
*/
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
  subtitle: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

/* Every action button renders ONLY when its handler is supplied. That keeps
   dead buttons off the page — pass a handler to show a button, omit it to
   hide one (which is also how callers gate actions behind admin rights).

   Design system notes:
   • Title = --fs-lg (26px) / semibold. Subtitle = --fs-sm / regular.
   • Buttons = --fs-sm / semibold, 44px min height for touch targets.
   • Only ONE button (Edit, the primary action) carries the brand red fill.
     Delete is a brand-tinted outline, View History is fully neutral — this
     is what keeps red inside the 10% budget on a page with three actions.
   • The row wraps on narrow screens instead of crushing the title.          */
const PageHeader = ({
  title,
  subtitle,
  onEdit,
  onDelete,
  onViewHistory,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: Props) => {
  const { colors, type, weight } = useTheme();

  const hasActions = !!(onViewHistory || onEdit || onDelete);

  const buttonBase = {
    fontSize: type.sm,
    fontWeight: weight.semibold,
    fontFamily: "var(--font-sans)",
    padding: "0 14px",
    minHeight: "44px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontSize: type.lg,
            fontWeight: weight.semibold,
            color: colors.ink,
            letterSpacing: "var(--ls-tight)",
            lineHeight: "var(--lh-tight)",
            marginBottom: "4px",
            overflowWrap: "break-word",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            fontSize: type.sm,
            fontWeight: weight.regular,
            color: colors.inkMuted,
          }}
        >
          {subtitle}
        </div>
      </div>

      {hasActions && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              style={{
                ...buttonBase,
                border: `1px solid ${colors.borderStrong}`,
                background: "transparent",
                color: colors.inkMuted,
              }}
            >
              View History
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                ...buttonBase,
                border: `1px solid ${colors.brand}`,
                background: colors.brand,
                color: colors.brandOn,
              }}
            >
              {editLabel}
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                ...buttonBase,
                border: `1px solid ${colors.brandText}`,
                background: "transparent",
                color: colors.brandText,
              }}
            >
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;