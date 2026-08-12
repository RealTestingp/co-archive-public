/* EditOperaModal.tsx
   Edits an existing opera: title, composers, librettists.

   Same form as AddOperaModal, pre-filled from the `opera` prop in an effect
   rather than initial state, because the modal stays mounted between openings
   and initial state is only read once.

   Editing an opera propagates widely. Characters belong to the opera rather
   than to a production, and every production of the work points at this one
   record, so fixing a misspelled title corrects it everywhere at once. That is
   the point of storing operas separately — and equally the risk, since a
   careless edit travels just as far.

   Composers and librettists are replaced wholesale on save (the backend clears
   and re-links), so the MultiSelect value is the complete intended set, not a
   delta.
*/
import { useState, useEffect, useMemo } from "react";
import { api } from "../../api";
import MultiSelect from "../dropdown/MultiSelect";
import { useTheme } from "../../context/ThemeContext";

interface LookupItem {
  id: number;
  name: string;
}

// The shape the Manage Archive Operas tab holds. GET /api/operas projects
// composers and librettists alongside the title, so no extra fetch is needed
// to pre-fill.
export interface OperaForEdit {
  id: number;
  title: string;
  composers: LookupItem[];
  librettists: LookupItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  opera: OperaForEdit;
}

const EditOperaModal = ({ isOpen, onClose, onSuccess, opera }: Props) => {
  const { isDark, colors } = useTheme();
  const [form, setForm] = useState({
    title: "",
    composerIds: [] as string[],
    librettistIds: [] as string[],
  });
  const [composers, setComposers] = useState<LookupItem[]>([]);
  const [librettists, setLibrettists] = useState<LookupItem[]>([]);
  const [newComposerName, setNewComposerName] = useState("");
  const [newLibrettistName, setNewLibrettistName] = useState("");
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

  const addButtonStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    border: `1px solid ${border}`,
    background: surface,
    color: textSecondary,
    fontFamily: "Inter, sans-serif",
    whiteSpace: "nowrap",
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchLookupsAndPrefill = async () => {
      setLoadingLookups(true);
      setError(null);
      setNewComposerName("");
      setNewLibrettistName("");
      try {
        const [c, l] = await Promise.all([
          api.get("/api/composers").then((r) => (r.ok ? r.json() : [])),
          api.get("/api/librettists").then((r) => (r.ok ? r.json() : [])),
        ]);
        setComposers(c);
        setLibrettists(l);

        setForm({
          title: opera.title,
          composerIds: (opera.composers ?? []).map((x) => String(x.id)),
          librettistIds: (opera.librettists ?? []).map((x) => String(x.id)),
        });
      } catch {
        setError("Failed to load form options. Is the API running?");
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookupsAndPrefill();
  }, [isOpen, opera]);

  const composerOptions = useMemo(
    () => composers.map((c) => ({ value: String(c.id), label: c.name })),
    [composers],
  );

  const librettistOptions = useMemo(
    () => librettists.map((l) => ({ value: String(l.id), label: l.name })),
    [librettists],
  );

  const handleAddComposer = async () => {
    const name = newComposerName.trim();
    if (!name) return;
    try {
      const res = await api.post("/api/composers", { name });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setComposers((prev) => [...prev, created]);
      setForm((p) => ({ ...p, composerIds: [...p.composerIds, String(created.id)] }));
      setNewComposerName("");
    } catch {
      setError("Failed to add composer.");
    }
  };

  const handleAddLibrettist = async () => {
    const name = newLibrettistName.trim();
    if (!name) return;
    try {
      const res = await api.post("/api/librettists", { name });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setLibrettists((prev) => [...prev, created]);
      setForm((p) => ({
        ...p,
        librettistIds: [...p.librettistIds, String(created.id)],
      }));
      setNewLibrettistName("");
    } catch {
      setError("Failed to add librettist.");
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/operas/${opera.id}`, {
        id: opera.id,
        title: form.title.trim(),
        composerIds: form.composerIds.map(Number),
        librettistIds: form.librettistIds.map(Number),
      });

      if (!res.ok) {
        // 409 on a duplicate title — the backend sends a bare string.
        const message = (await res.text().catch(() => "")).replace(/^"|"$/g, "");
        throw new Error(message || "Failed to update opera. Please try again.");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
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
            Edit Opera
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
            {/* Title */}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                Title <span style={{ color: "#9B1C1C" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. La Traviata"
                style={inputStyle}
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            {/* Composers */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Composers</label>
              <MultiSelect
                size="md"
                block
                portal
                theme="auto"
                placeholder="Select composers"
                ariaLabel="Composers"
                value={form.composerIds}
                options={composerOptions}
                onChange={(v) => setForm((p) => ({ ...p, composerIds: v }))}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <input
                  type="text"
                  placeholder="Add new composer…"
                  style={{ ...inputStyle, flex: 1 }}
                  value={newComposerName}
                  onChange={(e) => setNewComposerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComposer();
                    }
                  }}
                />
                <button onClick={handleAddComposer} style={addButtonStyle}>
                  + Add
                </button>
              </div>
            </div>

            {/* Librettists */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Librettists</label>
              <MultiSelect
                size="md"
                block
                portal
                theme="auto"
                placeholder="Select librettists"
                ariaLabel="Librettists"
                value={form.librettistIds}
                options={librettistOptions}
                onChange={(v) => setForm((p) => ({ ...p, librettistIds: v }))}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <input
                  type="text"
                  placeholder="Add new librettist…"
                  style={{ ...inputStyle, flex: 1 }}
                  value={newLibrettistName}
                  onChange={(e) => setNewLibrettistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLibrettist();
                    }
                  }}
                />
                <button onClick={handleAddLibrettist} style={addButtonStyle}>
                  + Add
                </button>
              </div>
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

export default EditOperaModal;
