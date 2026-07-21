import { useState, useEffect, useMemo } from "react";
import { api, uploadFile } from "../../api";
import Dropdown from "../dropdown/Dropdown";

// UpdateProductionDto (backend) only touches these fields — performances,
// cast, creative, crew, orchestra, and chorus are NOT editable through this
// endpoint, so this modal is a simple details form, not the full
// AddProductionModal wizard.

interface LookupItem {
  id: number;
  name?: string;
  label?: string;
  title?: string;
}

interface EventType {
  id: number;
  name: string;
  trackMilestones: boolean;
}

interface Opera {
  id: number;
  title: string;
}

interface Lookups {
  seasons: LookupItem[];
  venues: LookupItem[];
  eventTypes: EventType[];
  languages: LookupItem[];
  operas: Opera[];
}

interface FormState {
  title: string;
  seasonId: string;
  eventTypeId: string;
  venueId: string;
  operaId: string;
  writtenLanguageId: string;
  sungLanguageId: string;
  runtimeMinutes: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  seasonId: "",
  eventTypeId: "",
  venueId: "",
  operaId: "",
  writtenLanguageId: "",
  sungLanguageId: "",
  runtimeMinutes: "",
  notes: "",
};

// The shape of production data this modal needs in order to pre-fill the
// form. Matches (a superset of) ProductionPage's `Production` interface.
export interface ProductionForEdit {
  id: number;
  title: string;
  season: string;
  eventType: string;
  venue: string;
  opera: string | null;
  writtenLanguage: string | null;
  sungLanguage: string | null;
  runtimeMinutes: number | null;
  notes: string | null;
  programPdfUrl: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  production: ProductionForEdit;
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

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const ACCEPTED_PDF_TYPE = "application/pdf";

// Every dropdown in this modal shares the same config: modal-sized, full
// width, portalled out of the modal's overflow container, and pinned light
// because the modal itself is hardcoded white.
const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "light",
  highlightWhenSet: false,
} as const;

const EditProductionModal = ({
  isOpen,
  onClose,
  onSuccess,
  production,
}: Props) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lookups, setLookups] = useState<Lookups>({
    seasons: [],
    venues: [],
    eventTypes: [],
    languages: [],
    operas: [],
  });
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Program PDF
  const [programPdfFile, setProgramPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Clear any leftover selection from a previous time this modal was open
    setProgramPdfFile(null);
    setPdfError(null);

    const fetchLookupsAndPrefill = async () => {
      setLoadingLookups(true);
      setError(null);
      try {
        const [seasons, venues, eventTypes, languages, operas] =
          await Promise.all([
            api.get("/api/seasons").then((r) => r.json()),
            api.get("/api/venues").then((r) => r.json()),
            api.get("/api/eventtypes").then((r) => r.json()),
            api.get("/api/languages").then((r) => r.json()),
            api.get("/api/operas").then((r) => r.json()),
          ]);
        setLookups({ seasons, venues, eventTypes, languages, operas });

        // NOTE: GET /api/productions/{id} returns season/eventType/venue/
        // opera/languages as display-name strings, not IDs. We match those
        // back against the lookup lists to recover the IDs the form (and
        // UpdateProductionDto) need. Same stopgap as EditPersonModal — if
        // two lookup entries ever share a display name this will misfire.
        // Ideally the API would return the *Id fields directly.
        const matchedSeason = (seasons as LookupItem[]).find(
          (s) => s.label === production.season,
        );
        const matchedEventType = (eventTypes as EventType[]).find(
          (e) => e.name === production.eventType,
        );
        const matchedVenue = (venues as LookupItem[]).find(
          (v) => v.name === production.venue,
        );
        const matchedOpera = (operas as Opera[]).find(
          (o) => o.title === production.opera,
        );
        const matchedWrittenLanguage = (languages as LookupItem[]).find(
          (l) => l.name === production.writtenLanguage,
        );
        const matchedSungLanguage = (languages as LookupItem[]).find(
          (l) => l.name === production.sungLanguage,
        );

        setForm({
          title: production.title,
          seasonId: matchedSeason ? String(matchedSeason.id) : "",
          eventTypeId: matchedEventType ? String(matchedEventType.id) : "",
          venueId: matchedVenue ? String(matchedVenue.id) : "",
          operaId: matchedOpera ? String(matchedOpera.id) : "",
          writtenLanguageId: matchedWrittenLanguage
            ? String(matchedWrittenLanguage.id)
            : "",
          sungLanguageId: matchedSungLanguage
            ? String(matchedSungLanguage.id)
            : "",
          runtimeMinutes:
            production.runtimeMinutes != null
              ? String(production.runtimeMinutes)
              : "",
          notes: production.notes ?? "",
        });
      } catch {
        setError("Failed to load form options. Is the API running?");
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookupsAndPrefill();
  }, [isOpen, production]);

  const set =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Dropdown gives us the value directly rather than an event.
  const setValue = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Dropdown option lists ──
  const seasonOptions = useMemo(
    () =>
      lookups.seasons.map((s) => ({
        value: String(s.id),
        label: s.label ?? String(s.id),
      })),
    [lookups.seasons],
  );

  const eventTypeOptions = useMemo(
    () =>
      lookups.eventTypes.map((e) => ({ value: String(e.id), label: e.name })),
    [lookups.eventTypes],
  );

  const venueOptions = useMemo(
    () =>
      lookups.venues.map((v) => ({
        value: String(v.id),
        label: v.name ?? String(v.id),
      })),
    [lookups.venues],
  );

  const operaOptions = useMemo(
    () => lookups.operas.map((o) => ({ value: String(o.id), label: o.title })),
    [lookups.operas],
  );

  const languageOptions = useMemo(
    () =>
      lookups.languages.map((l) => ({
        value: String(l.id),
        label: l.name ?? String(l.id),
      })),
    [lookups.languages],
  );

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== ACCEPTED_PDF_TYPE) {
      setPdfError("Please select a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdfError("PDF must be under 50MB.");
      return;
    }
    setPdfError(null);
    setProgramPdfFile(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.seasonId || !form.eventTypeId || !form.venueId) {
      setError("Title, season, event type, and venue are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Update requires `id` in the body (UpdateProductionDto), same as
      // persons — the controller 400s if it doesn't match the route id.
      // Also passing programPdfUrl through unchanged, since this modal
      // doesn't support editing it directly via this endpoint — a new
      // upload (below) is what actually updates ProgramPdfUrl.
      const res = await api.put(`/api/productions/${production.id}`, {
        id: production.id,
        title: form.title.trim(),
        seasonId: Number(form.seasonId),
        eventTypeId: Number(form.eventTypeId),
        venueId: Number(form.venueId),
        operaId: form.operaId ? Number(form.operaId) : null,
        writtenLanguageId: form.writtenLanguageId
          ? Number(form.writtenLanguageId)
          : null,
        sungLanguageId: form.sungLanguageId
          ? Number(form.sungLanguageId)
          : null,
        runtimeMinutes: form.runtimeMinutes ? Number(form.runtimeMinutes) : null,
        notes: form.notes.trim() || null,
        programPdfUrl: production.programPdfUrl ?? null,
      });

      if (!res.ok) throw new Error("Failed to update production.");

      // Upload the new program PDF, if one was selected. Awaited since the
      // user is looking at this production's page right now and expects
      // to see the new PDF link once the modal closes.

      if (programPdfFile) {
        try {
          const uploadRes = await uploadFile(
            `/api/uploads/program-pdf/${production.id}`,
            programPdfFile,
            "file",
          );
          if (!uploadRes.ok) {
            setError(
              "Production was updated, but the new PDF failed to upload. Try editing again to retry the PDF.",
            );
            setSubmitting(false);
            return;
          }
        } catch {
          setError(
            "Production was updated, but the new PDF failed to upload. Try editing again to retry the PDF.",
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
    setProgramPdfFile(null);
    setPdfError(null);
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>
            Edit Production
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
            <div style={fieldWrap}>
              <label style={labelStyle}>
                Production Title <span style={{ color: "#9B1C1C" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tosca"
                style={inputStyle}
                value={form.title}
                onChange={set("title")}
              />
            </div>

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
                  Season <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <Dropdown
                  {...DD}
                  placeholder="Select season"
                  ariaLabel="Season"
                  value={form.seasonId}
                  options={seasonOptions}
                  onChange={setValue("seasonId")}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Event Type <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <Dropdown
                  {...DD}
                  placeholder="Select type"
                  ariaLabel="Event type"
                  value={form.eventTypeId}
                  options={eventTypeOptions}
                  onChange={setValue("eventTypeId")}
                />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>
                Venue <span style={{ color: "#9B1C1C" }}>*</span>
              </label>
              <Dropdown
                {...DD}
                placeholder="Select venue"
                ariaLabel="Venue"
                value={form.venueId}
                options={venueOptions}
                onChange={setValue("venueId")}
              />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Opera</label>
              <Dropdown
                {...DD}
                placeholder="None"
                ariaLabel="Opera"
                value={form.operaId}
                options={operaOptions}
                onChange={setValue("operaId")}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <label style={labelStyle}>Written Language</label>
                <Dropdown
                  {...DD}
                  placeholder="Select"
                  ariaLabel="Written language"
                  value={form.writtenLanguageId}
                  options={languageOptions}
                  onChange={setValue("writtenLanguageId")}
                />
              </div>
              <div>
                <label style={labelStyle}>Sung Language</label>
                <Dropdown
                  {...DD}
                  placeholder="Select"
                  ariaLabel="Sung language"
                  value={form.sungLanguageId}
                  options={languageOptions}
                  onChange={setValue("sungLanguageId")}
                />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Runtime (minutes)</label>
              <input
                type="number"
                placeholder="e.g. 150"
                style={inputStyle}
                value={form.runtimeMinutes}
                onChange={set("runtimeMinutes")}
                min={0}
              />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Notes</label>
              <textarea
                placeholder="Any additional notes..."
                style={{ ...inputStyle, resize: "vertical", minHeight: "68px" }}
                value={form.notes}
                onChange={set("notes")}
              />
            </div>

            {/* Program PDF */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Program PDF</label>
              {programPdfFile ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    📄 {programPdfFile.name}
                  </span>
                  <button
                    onClick={() => setProgramPdfFile(null)}
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  {production.programPdfUrl && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "6px",
                      }}
                    >
                      Current:{" "}
                      <a
                        href={production.programPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#9B1C1C" }}
                      >
                        View existing PDF
                      </a>
                    </div>
                  )}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #d1d5db",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    {production.programPdfUrl
                      ? "Click to replace PDF (max 50MB)"
                      : "Click to upload program PDF (optional, max 50MB)"}
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={handlePdfChange}
                    />
                  </label>
                </>
              )}
              {pdfError && (
                <div
                  style={{ fontSize: "12px", color: "#9B1C1C", marginTop: "4px" }}
                >
                  {pdfError}
                </div>
              )}
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "1.5rem",
              }}
            >
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
          </>
        )}
      </div>
    </div>
  );
};

export default EditProductionModal;