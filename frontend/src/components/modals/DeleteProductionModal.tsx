interface Props {
  isOpen: boolean;
  productionTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error?: string | null;
  // Pass counts derived from the production's performances/cast/creative/
  // crew/orchestra/chorus arrays. Same reasoning as DeletePersonModal:
  // ProductionsController.Delete() has no try/catch and no FK handling,
  // so we block client-side rather than let a doomed request through.
  // CONFIRM WITH VERITY (same question asked for persons, not yet
  // confirmed for productions): does deleting a production with
  // performances/appearances throw, or cascade? Assuming "throws" here
  // since it's the same unguarded Remove() + SaveChangesAsync() pattern.
  performanceCount?: number;
  personnelCount?: number;
}

const DeleteProductionModal = ({
  isOpen,
  productionTitle,
  onCancel,
  onConfirm,
  isDeleting,
  error,
  performanceCount = 0,
  personnelCount = 0,
}: Props) => {
  if (!isOpen) return null;

  const isBlocked = performanceCount > 0 || personnelCount > 0;

  const detailParts: string[] = [];
  if (performanceCount > 0) {
    detailParts.push(
      `${performanceCount} performance date${performanceCount === 1 ? "" : "s"}`,
    );
  }
  if (personnelCount > 0) {
    detailParts.push(
      `${personnelCount} person${personnelCount === 1 ? "" : "s"} (cast/crew)`,
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
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
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#fef2f2",
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
                color: "#111",
                marginBottom: "4px",
              }}
            >
              {isBlocked
                ? `Can't delete ${productionTitle}`
                : `Delete ${productionTitle}?`}
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
              {isBlocked
                ? "This production cannot be deleted because it has performance and cast/crew history on record. Remove these records first, then try deleting again."
                : `This will permanently delete ${productionTitle} from the archive. This action cannot be undone.`}
            </p>
          </div>
        </div>

        {isBlocked && (
          <div
            style={{
              fontSize: "12px",
              color: "#9B1C1C",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              padding: "8px 12px",
              marginBottom: "1rem",
            }}
          >
            {productionTitle} has {detailParts.join(" and ")} on record.
          </div>
        )}

        {error && (
          <div
            style={{
              fontSize: "12px",
              color: "#9B1C1C",
              marginBottom: "1rem",
              padding: "8px 12px",
              background: "#fef2f2",
              borderRadius: "6px",
              border: "1px solid #fecaca",
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
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
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
              {isDeleting ? "Deleting..." : "Delete Production"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteProductionModal;