/* EditCharacterModal.tsx
   Edits an existing character.

   Same form as AddCharacterModal, pre-filled from the character prop in an
   effect rather than initial state, because the modal stays mounted between
   openings and initial state is only read once.

   Editing a character changes it everywhere at once, since productions do not
   own their own copy of a role. Correcting a spelling fixes it across every
   staging, which is the point of storing characters against the opera. It also
   means a careless edit propagates just as widely.
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

// The shape of character data this modal needs to pre-fill. Matches (a
// superset of) CharacterPage's `Character` interface — operaId comes through
// as a real number, so no name-matching stopgap is needed here.
export interface CharacterForEdit {
  id: number;
  name: string;
  operaId: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  character: CharacterForEdit;
}

// Full-width, portalled dropdown; theme "auto" so it follows the app theme
// like the modal now does.
const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "auto",
  highlightWhenSet: false,
} as const;

const EditCharacterModal = ({ isOpen, onClose, onSuccess, character }: Props) => {
  const { isDark, colors } = useTheme();
  const [form, setForm] = useState<FormState>({ name: "", operaId: "" });
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

    const fetchLookupsAndPrefill = async () => {
      setLoadingLookups(true);
      setError(null);
      try {
        const res = await api.get("/api/operas");
        if (!res.ok) throw new Error();
        setOperas(await res.json());

        setForm({
          name: character.name,
          operaId: character.operaId != null ? String(character.operaId) : "",
        });
      } catch {
        setError("Failed to load form options. Is the API running?");
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookupsAndPrefill();
  }, [isOpen, character]);

  const operaOptions = useMemo(
    () => operas.map((o) => ({ value: String(o.id), label: o.title })),
    [operas],
  );

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Character name is required.");
      return;
    }
    // OperaId is a non-nullable int on UpdateCharacterDto — a character must
    // belong to an opera, so this can't be left blank.
    if (!form.operaId) {
      setError("Opera is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.put(`/api/characters/${character.id}`, {
        id: character.id,
        name: form.name.trim(),
        operaId: Number(form.operaId),
      });

      if (!res.ok) throw new Error();

      onSuccess?.();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
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
            Edit Character
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

            {/* Opera — required; characters belong to an opera (non-nullable). */}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                Opera <span style={{ color: "#9B1C1C" }}>*</span>
              </label>
              <Dropdown
                {...DD}
                allowClear={false}
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
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditCharacterModal;