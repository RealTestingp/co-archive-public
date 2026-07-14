import { useState, useEffect } from "react";
import { api } from "../api";

interface LookupItem {
  id: number;
  name: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  voiceTypeId: string;
  nationalityIds: number[];
  isActive: boolean;
}

// The shape of person data this modal needs in order to pre-fill the form.
// Matches (a superset of) PersonPage's `Person` interface.
export interface PersonForEdit {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string | null;
  voiceType: string | null;
  nationalities: string[];
  isActive: boolean;
  profileImageUrl?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  person: PersonForEdit;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "13px",
  fontFamily: "Inter, sans-serif",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  outline: "none",
  boxSizing: "border-box",
  color: "#111",
  background: "#fff",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  color: "#374151",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "12px",
  paddingRight: "32px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#6b7280",
  marginBottom: "5px",
  display: "block",
};

const fieldWrap: React.CSSProperties = { marginBottom: "1.1rem" };

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  voiceTypeId: "",
  nationalityIds: [],
  isActive: true,
};

const EditPersonModal = ({ isOpen, onClose, onSuccess, person }: Props) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [voiceTypes, setVoiceTypes] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLookupsAndPrefill = async () => {
      setLoadingLookups(true);
      setError(null);
      try {
        const [vt, nat] = await Promise.all([
          api.get(`/api/voicetypes`).then((r) => r.json()),
          api.get(`/api/nationalities`).then((r) => r.json()),
        ]);
        setVoiceTypes(vt);
        setNationalities(nat);

        // NOTE: GET /api/persons/{id} currently returns voiceType and
        // nationalities as display-name strings, not IDs. We match those
        // names back against the lookup lists to recover the IDs needed
        // for the dropdown/chip selection. This is a stopgap — if two
        // lookup entries ever share a display name this will misfire.
        // Better long-term fix: have the API return voiceTypeId and
        // nationalityIds directly on the person detail response.
        const matchedVoiceType = (vt as LookupItem[]).find(
          (v) => v.name === person.voiceType,
        );
        const matchedNationalityIds = (nat as LookupItem[])
          .filter((n) => person.nationalities.includes(n.name))
          .map((n) => n.id);

        setForm({
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName ?? "",
          email: person.email ?? "",
          voiceTypeId: matchedVoiceType ? String(matchedVoiceType.id) : "",
          nationalityIds: matchedNationalityIds,
          isActive: person.isActive,
        });
      } catch {
        setError("Failed to load form options. Is the API running?");
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookupsAndPrefill();
  }, [isOpen, person]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleNationality = (id: number) => {
    setForm((prev) => ({
      ...prev,
      nationalityIds: prev.nationalityIds.includes(id)
        ? prev.nationalityIds.filter((n) => n !== id)
        : [...prev.nationalityIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Update requires `id` in the body (UpdatePersonDto) — the controller
      // 400s if it doesn't match the route id. It also unconditionally
      // overwrites ProfileImageUrl from the DTO, so we must pass the
      // person's existing image URL through unchanged since this modal
      // doesn't support editing the photo.
      const res = await api.put(`/api/persons/${person.id}`, {
        id: person.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || null,
        email: form.email.trim() || null,
        voiceTypeId: form.voiceTypeId ? Number(form.voiceTypeId) : null,
        nationalityIds: form.nationalityIds,
        isActive: form.isActive,
        profileImageUrl: person.profileImageUrl ?? null,
      });

      if (!res.ok) throw new Error("Failed to update person.");

      handleClose();
      onSuccess?.();
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
          maxWidth: "500px",
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
            Edit Person
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
            {/* First + Last Name */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <label style={labelStyle}>
                  First Name <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria"
                  style={inputStyle}
                  value={form.firstName}
                  onChange={set("firstName")}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Last Name <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Callas"
                  style={inputStyle}
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </div>
            </div>

            {/* Middle Name */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Middle Name</label>
              <input
                type="text"
                placeholder="e.g. Anna"
                style={inputStyle}
                value={form.middleName}
                onChange={set("middleName")}
              />
            </div>

            {/* Email */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="e.g. maria@example.com"
                style={inputStyle}
                value={form.email}
                onChange={set("email")}
              />
            </div>

            {/* Voice Type */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Voice Type</label>
              <select
                style={selectStyle}
                value={form.voiceTypeId}
                onChange={set("voiceTypeId")}
              >
                <option value="">Select voice type</option>
                {voiceTypes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nationalities */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Nationality</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {nationalities.map((n) => {
                  const selected = form.nationalityIds.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleNationality(n.id)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "4px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        border: selected
                          ? "1px solid #9B1C1C"
                          : "1px solid #e5e7eb",
                        background: selected ? "#fef2f2" : "#fff",
                        color: selected ? "#9B1C1C" : "#6b7280",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "1.1rem",
              }}
            >
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                style={{ cursor: "pointer" }}
              />
              <label
                htmlFor="isActiveEdit"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Currently active with Calgary Opera
              </label>
            </div>

            {/* Error */}
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

export default EditPersonModal;