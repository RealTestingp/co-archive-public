import { useState, useEffect, useRef, useMemo } from "react";
import { api, uploadFile } from "../../api";
import Dropdown from "../dropdown/Dropdown";
import { useTheme } from "../../context/ThemeContext";

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

// The shape of person data this modal needs to pre-fill. Matches (a superset
// of) PersonPage's `Person` interface.
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

const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "auto",
  highlightWhenSet: false,
} as const;

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  voiceTypeId: "",
  nationalityIds: [],
  isActive: true,
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EditPersonModal = ({ isOpen, onClose, onSuccess, person }: Props) => {
  const { isDark, colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [voiceTypes, setVoiceTypes] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);

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
  const avatarBg = isDark ? "#2a2a2a" : "#f3e8e8";

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

    setImageFile(null);
    setImagePreview(null);

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

        // NOTE: GET /api/persons/{id} returns voiceType and nationalities as
        // display-name strings, not IDs. We match names back against the
        // lookup lists to recover the IDs. Stopgap — if two lookup entries
        // ever share a display name this will misfire. Ideal fix: have the
        // API return voiceTypeId and nationalityIds on the detail response.
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
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const voiceTypeOptions = useMemo(
    () => voiceTypes.map((v) => ({ value: String(v.id), label: v.name })),
    [voiceTypes],
  );

  const toggleNationality = (id: number) => {
    setForm((prev) => ({
      ...prev,
      nationalityIds: prev.nationalityIds.includes(id)
        ? prev.nationalityIds.filter((n) => n !== id)
        : [...prev.nationalityIds, id],
    }));
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previewInitials = [person.firstName[0], person.lastName[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Update requires `id` in the body (UpdatePersonDto). It also
      // overwrites ProfileImageUrl from the DTO, so we pass the existing URL
      // through unchanged — a new image (if any) is uploaded separately below.
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

      if (imageFile) {
        try {
          const uploadRes = await uploadFile(
            `/api/uploads/profile-image/${person.id}`,
            imageFile,
            "file",
          );
          if (!uploadRes.ok) {
            setError(
              "Person was updated, but the new photo failed to upload. Try editing again to retry the photo.",
            );
            setSubmitting(false);
            return;
          }
        } catch {
          setError(
            "Person was updated, but the new photo failed to upload. Try editing again to retry the photo.",
          );
          setSubmitting(false);
          return;
        }
      }

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
    setImageFile(null);
    setImagePreview(null);
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
          maxWidth: "500px",
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
            Edit Person
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
            {/* Avatar picker */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  onClick={handleImageClick}
                  onMouseEnter={() => setAvatarHovered(true)}
                  onMouseLeave={() => setAvatarHovered(false)}
                  title="Click to change photo"
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `1.5px ${imagePreview || avatarHovered ? "solid #9B1C1C" : `dashed ${border}`}`,
                    cursor: "pointer",
                    position: "relative",
                    background: avatarBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : person.profileImageUrl ? (
                    <img
                      src={person.profileImageUrl}
                      alt="Current"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : previewInitials ? (
                    <span
                      style={{
                        fontSize: "18px",
                        color: "#9B1C1C",
                        fontWeight: 500,
                      }}
                    >
                      {previewInitials}
                    </span>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={textMuted}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}

                  {avatarHovered && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: textMuted }}>
                  {imageFile ? imageFile.name : "Click photo to replace"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </div>
            </div>

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
              <Dropdown
                {...DD}
                placeholder="Select voice type"
                ariaLabel="Voice type"
                value={form.voiceTypeId}
                options={voiceTypeOptions}
                onChange={(v) => setForm((prev) => ({ ...prev, voiceTypeId: v }))}
              />
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
                        border: `1px solid ${selected ? "#9B1C1C" : border}`,
                        background: selected ? dangerBg : inputBg,
                        color: selected ? "#9B1C1C" : textSecondary,
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
                  color: textPrimary,
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

export default EditPersonModal;