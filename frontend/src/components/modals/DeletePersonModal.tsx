import { useTheme } from "../../context/ThemeContext";

interface Props {
  isOpen: boolean;
  personName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error?: string | null;
  // Pass person.mainStageProductionCount (or similar) from the caller.
  // Confirmed with Verity: Persons.Remove() has no FK handling, so
  // deleting a person with appearances throws a raw DB error (no
  // cascade). We block the delete client-side in that case instead of
  // letting the user hit a failed request — Delete has no try/catch on
  // the backend, so the failure wouldn't come back as a clean message.
  productionCount?: number;
}

const DeletePersonModal = ({
  isOpen,
  personName,
  onCancel,
  onConfirm,
  isDeleting,
  error,
  productionCount = 0,
}: Props) => {
  const { isDark, colors } = useTheme();

  if (!isOpen) return null;

  const isBlocked = productionCount > 0;

  // ── Theme tokens ──
  const overlay = "rgba(0,0,0,0.5)";
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const dangerBg = isDark ? "#2a1414" : "#fef2f2";
  const dangerBorder = isDark ? "#4a2020" : "#fecaca";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "400px",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.6)"
            : "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "1rem",
          }}
        >
          {/* Danger icon — red kept as a destructive-action signal. */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: dangerBg,
              border: `1px solid ${dangerBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B1C1C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: textPrimary,
                marginBottom: "4px",
              }}
            >
              {isBlocked ? `Can't delete ${personName}` : `Delete ${personName}?`}
            </h2>
            <p style={{ fontSize: "13px", color: textSecondary, lineHeight: 1.5 }}>
              {isBlocked
                ? "This person cannot be deleted because they have production history on record. Remove their appearances first, or mark them as inactive instead."
                : `This will permanently delete ${personName} from the archive. This action cannot be undone.`}
            </p>
          </div>
        </div>

        {isBlocked && (
          <div
            style={{
              fontSize: "12px",
              color: "#9B1C1C",
              background: dangerBg,
              border: `1px solid ${dangerBorder}`,
              borderRadius: "6px",
              padding: "8px 12px",
              marginBottom: "1rem",
            }}
          >
            {personName} has {productionCount} production credit
            {productionCount === 1 ? "" : "s"} on record.
          </div>
        )}

        {error && (
          <div
            style={{
              fontSize: "12px",
              color: "#9B1C1C",
              marginBottom: "1rem",
              padding: "8px 12px",
              background: dangerBg,
              borderRadius: "6px",
              border: `1px solid ${dangerBorder}`,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "1.25rem",
          }}
        >
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              border: `1px solid ${border}`,
              background: surface,
              color: textPrimary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isBlocked ? "Close" : "Cancel"}
          </button>
          {!isBlocked && (
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                border: "1px solid #9B1C1C",
                background: isDeleting ? "#c85a5a" : "#9B1C1C",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Person"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletePersonModal;