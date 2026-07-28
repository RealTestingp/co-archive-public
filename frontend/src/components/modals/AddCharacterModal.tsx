/* AddCharacterModal.tsx
   Creates a character, meaning a role within an opera.

   The opera is required, and that is the design decision here. A character
   without an opera would be unattachable, since roles only exist inside a work.
   Tying them to the opera rather than to a production is what lets every
   staging of Madama Butterfly reuse the same Cio-Cio-San record, which is what
   makes "everyone who has sung this role" answerable.

   The simplest of the add modals: one record, no file upload, no dependent
   rows, so it is a single POST with no ordering to worry about.
*/
import { useState, useEffect, useMemo } from "react";
import { api } from "../../api";
import Dropdown from "../dropdown/Dropdown";
import { useTheme } from "../../context/ThemeContext";

interface LookupItem {
  id: number;
  title: string;
}

interface FormState {
  name: string;
  operaId: string;
}

const EMPTY_FORM: FormState = { name: "", operaId: "" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Full-width, portalled dropdown. theme "auto" now that the modal itself
// follows the app theme.
const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "auto",
  highlightWhenSet: false,
} as const;

const AddCharacterModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const { isDark, colors } = useTheme();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [operas, setOperas] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Theme tokens ──
  const overlay = "rgba(0,0,0,0.5)";
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const inputBg = isDark ? "#161616" : "#fff";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const dangerBg = isDark ? "#2a1414" : "#fef2f2";
  const dangerBorder = isDark ? "#4a2020" : "#fecaca";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    color: textPrimary,
    background: inputBg,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textSecondary,
    marginBottom: "5px",
    display: "block",
  };

  const fieldWrap: React.CSSProperties = { marginBottom: "1.1rem" };

  useEffect(() => {
    if (!isOpen) return;
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const res = await api.get("/api/operas");
        if (!res.ok) throw new Error();
        setOperas(await res.json());
      } catch {
        setError("Failed to load form options. Is the API running?");
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, [isOpen]);

  const operaOptions = useMemo(
    () => operas.map((o) => ({ value: String(o.id), label: o.title })),
    [operas],
  );

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Character name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post("/api/characters", {
        name: form.name.trim(),
        operaId: form.operaId ? Number(form.operaId) : null,
      });

      if (!res.ok) throw new Error();

      setForm(EMPTY_FORM);
      onSuccess?.();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

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
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.6)"
            : "0 20px 60px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: textPrimary }}>
            Add Character
          </h2>
          <button
            onClick={handleClose}
            style={{
              fontSize: "18px",
              color: textMuted,
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            ✕
          </button>
        </div>

        {loadingLookups ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 0",
              fontSize: "13px",
              color: textSecondary,
            }}
          >
            Loading form options...
          </div>
        ) : (
          <>
            {/* Character Name */}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                Character Name <span style={{ color: "#9B1C1C" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Violetta"
                style={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Opera */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Opera</label>
              <Dropdown
                {...DD}
                placeholder="Select opera"
                ariaLabel="Opera"
                value={form.operaId}
                options={operaOptions}
                onChange={(v) => setForm((prev) => ({ ...prev, operaId: v }))}
              />
            </div>

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

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.5rem",
              }}
            >
              <span style={{ fontSize: "11px", color: textMuted }}>
                <span style={{ color: "#9B1C1C" }}>*</span> Required fields
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleClose}
                  disabled={submitting}
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
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "8px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: "1px solid #9B1C1C",
                    background: submitting ? "#c85a5a" : "#9B1C1C",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {submitting ? "Saving..." : "Add Character"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddCharacterModal;