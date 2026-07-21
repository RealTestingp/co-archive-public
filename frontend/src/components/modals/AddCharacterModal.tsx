import { useState, useEffect, useMemo } from "react";
import { api } from "../../api";
import Dropdown from "../dropdown/Dropdown";

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

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "13px",
  fontFamily: "Inter, sans-serif",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  outline: "none",
  boxSizing: "border-box" as const,
  color: "#111",
};

const labelStyle = {
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6b7280",
  marginBottom: "5px",
  display: "block",
};

const fieldWrap = { marginBottom: "1.1rem" };

// Modal-sized, full width, portalled out of the modal's overflow container,
// and pinned light because the modal is hardcoded white.
const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "light",
  highlightWhenSet: false,
} as const;

const AddCharacterModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [operas, setOperas] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const set =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
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
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>
            Add Character
          </h2>
          <button
            onClick={handleClose}
            style={{
              fontSize: "18px",
              color: "#9ca3af",
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
              color: "#6b7280",
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
                onChange={set("name")}
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
                  background: "#fef2f2",
                  borderRadius: "6px",
                  border: "1px solid #fecaca",
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
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
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
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
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