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

const PageHeader = ({
  title,
  subtitle,
  onEdit,
  onDelete,
  onViewHistory,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: Props) => {
  const { colors, isDark } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: colors.textPrimary,
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          {title}
        </h1>
        <div style={{ fontSize: "13px", color: colors.textSecondary }}>
          {subtitle}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onViewHistory}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "7px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            border: `1px solid ${isDark ? "#3a3a3a" : "#e5e7eb"}`,
            background: "transparent",
            color: colors.textSecondary,
            marginLeft: "8px",
          }}
        >
          View History
        </button>
        <button
          onClick={onEdit}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "7px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            border: `1px solid ${colors.accent}`,
            background: colors.accent,
            color: "#fff",
            marginLeft: "8px",
          }}
        >
          {editLabel}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              padding: "7px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              border: `1px solid ${isDark ? "#4a2020" : "#fecaca"}`,
              background: "transparent",
              color: colors.accent,
              marginLeft: "8px",
            }}
          >
            {deleteLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;