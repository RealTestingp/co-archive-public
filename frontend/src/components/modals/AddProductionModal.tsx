import { useState, useEffect, useMemo } from "react";
import { api, uploadFile } from "../../api";
import Dropdown from "../dropdown/Dropdown";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Opera {
  id: number;
  title: string;
}

interface EventType {
  id: number;
  name: string;
  trackMilestones: boolean;
}

interface LookupItem {
  id: number;
  name?: string;
  label?: string;
  title?: string;
}

// NOTE: the list endpoint (/api/characters) returns `operaTitle` and may omit
// `operaId`, while the detail endpoint returns `opera` + `operaId`. All three
// are optional here so the opera filter below can cope with either shape.
interface Character {
  id: number;
  name: string;
  opera?: string;
  operaTitle?: string;
  operaId?: number;
}

interface PersonSearchResult {
  id: number;
  firstName: string;
  lastName: string;
}

interface Position {
  id: number;
  name: string;
  contributorTypeId: number;
}

interface CastRow {
  id: string;
  characterId: number;
  characterName: string;
  personSearch: string;
  personId: string;
  personName: string;
}

interface CrewRow {
  id: string;
  personSearch: string;
  personId: string;
  personName: string;
  contributorTypeId: string;
  positionId: string;
}

interface Lookups {
  seasons: LookupItem[];
  venues: LookupItem[];
  eventTypes: EventType[];
  languages: LookupItem[];
  contributorTypes: LookupItem[];
}

interface ProductionForm {
  title: string;
  seasonId: string;
  eventTypeId: string;
  venueId: string;
  writtenLanguageId: string;
  sungLanguageId: string;
  runtimeMinutes: string;
  notes: string;
}

interface NewVenue {
  name: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

const EMPTY_PRODUCTION: ProductionForm = {
  title: "",
  seasonId: "",
  eventTypeId: "",
  venueId: "",
  writtenLanguageId: "",
  sungLanguageId: "",
  runtimeMinutes: "",
  notes: "",
};

const EMPTY_VENUE: NewVenue = {
  name: "",
  streetAddress: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

// Every dropdown in this modal shares the same config: modal-sized, full
// width, portalled out of the modal's overflow container (the modal panel is
// `overflow-y: auto`, which would otherwise clip the list), and pinned light
// because the modal itself is hardcoded white and doesn't read ThemeContext.
const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "light",
  highlightWhenSet: false,
} as const;

// Shared styles for the inline "add new lookup" accordions (season/venue/language)
const addLookupBtnStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9B1C1C",
  background: "none",
  border: "1px dashed #fca5a5",
  borderRadius: "6px",
  padding: "7px 14px",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};

const accordionBoxStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1.1rem",
};

const accordionHeadStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "0.75rem",
};

const accordionTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111",
};

const accordionCancelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  background: "none",
  border: "none",
  cursor: "pointer",
};

const accordionErrStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9B1C1C",
  marginBottom: "0.5rem",
};

const accordionSaveStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  padding: "7px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  border: "1px solid #9B1C1C",
  background: "#9B1C1C",
  color: "#fff",
  fontFamily: "Inter, sans-serif",
};

const newId = () => Math.random().toString(36).slice(2);

const STEPS = ["Opera", "Details", "Characters", "Cast & Crew", "Review"];

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const ACCEPTED_PDF_TYPE = "application/pdf";

// ── Component ─────────────────────────────────────────────────────────────────

const AddProductionModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [step, setStep] = useState(0);

  // Step 0 — Opera
  const [operas, setOperas] = useState<Opera[]>([]);
  const [selectedOperaId, setSelectedOperaId] = useState<number | null>(null);
  const [showAddOpera, setShowAddOpera] = useState(false);
  const [newOpera, setNewOpera] = useState({
    title: "",
    composer: "",
    librettist: "",
  });
  const [savingOpera, setSavingOpera] = useState(false);
  const [operaError, setOperaError] = useState<string | null>(null);

  // Step 1 — Production details
  const [form, setForm] = useState<ProductionForm>(EMPTY_PRODUCTION);
  const [lookups, setLookups] = useState<Lookups>({
    seasons: [],
    venues: [],
    eventTypes: [],
    languages: [],
    contributorTypes: [],
  });
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [productionError, setProductionError] = useState<string | null>(null);

  // Step 1 — Inline lookup creation (season / venue / language)
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeasonLabel, setNewSeasonLabel] = useState("");
  const [savingSeason, setSavingSeason] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenue, setNewVenue] = useState<NewVenue>(EMPTY_VENUE);
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);

  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState("");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  // Step 1 — Program PDF
  const [programPdfFile, setProgramPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Step 2 — Characters
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
    [],
  );
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [savingCharacter, setSavingCharacter] = useState(false);
  const [characterError, setCharacterError] = useState<string | null>(null);

  // Step 3 — Cast & Crew
  const [castRows, setCastRows] = useState<CastRow[]>([]);
  const [crewRows, setCrewRows] = useState<CrewRow[]>([]);
  const [personResults, setPersonResults] = useState<
    Record<string, PersonSearchResult[]>
  >({});
  // Positions cached per contributor type. This used to be a single shared
  // array, which meant one crew row changing its Type wiped the options out
  // from under every other row — row 1's Position dropdown would empty while
  // still holding a selected positionId underneath.
  const [positionsByType, setPositionsByType] = useState<
    Record<string, Position[]>
  >({});

  // Save
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pdfUploadWarning, setPdfUploadWarning] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const makeCrewRow = (): CrewRow => ({
    id: newId(),
    personSearch: "",
    personId: "",
    personName: "",
    contributorTypeId: "",
    positionId: "",
  });

  // ── Derived ──
  const selectedEventType = lookups.eventTypes.find(
    (e) => String(e.id) === form.eventTypeId,
  );
  const requiresOpera = selectedEventType
    ? selectedEventType.trackMilestones
    : true;
  const selectedOpera = operas.find((o) => o.id === selectedOperaId);

  // Match on operaId when the API gives us one; otherwise fall back to
  // comparing the opera title, since the list endpoint returns `operaTitle`
  // and may not include `operaId` at all. Without the fallback every
  // character gets filtered out and the Characters step looks empty.
  const operaCharacters = allCharacters.filter((c) => {
    if (selectedOperaId == null) return false;
    if (c.operaId != null) return c.operaId === selectedOperaId;
    const title = c.opera ?? c.operaTitle;
    return !!selectedOpera && title === selectedOpera.title;
  });

  const selectedCharacters = operaCharacters.filter((c) =>
    selectedCharacterIds.includes(c.id),
  );
  const canAdvanceStep2 = !!(
    form.title.trim() &&
    form.seasonId &&
    form.eventTypeId &&
    form.venueId
  );

  // ── Dropdown option lists ──
  const operaOptions = useMemo(
    () => operas.map((o) => ({ value: String(o.id), label: o.title })),
    [operas],
  );

  const eventTypeOptions = useMemo(
    () =>
      lookups.eventTypes.map((e) => ({ value: String(e.id), label: e.name })),
    [lookups.eventTypes],
  );

  const seasonOptions = useMemo(
    () =>
      lookups.seasons.map((s) => ({
        value: String(s.id),
        label: s.label ?? String(s.id),
      })),
    [lookups.seasons],
  );

  const venueOptions = useMemo(
    () =>
      lookups.venues.map((v) => ({
        value: String(v.id),
        label: v.name ?? String(v.id),
      })),
    [lookups.venues],
  );

  const languageOptions = useMemo(
    () =>
      lookups.languages.map((l) => ({
        value: String(l.id),
        label: l.name ?? String(l.id),
      })),
    [lookups.languages],
  );

  const contributorTypeOptions = useMemo(
    () =>
      lookups.contributorTypes.map((t) => ({
        value: String(t.id),
        label: t.name ?? String(t.id),
      })),
    [lookups.contributorTypes],
  );

  const fetchOperas = async () => {
    try {
      const res = await api.get("/api/operas");
      if (res.ok) setOperas(await res.json());
    } catch {
      /* ignore */
    }
  };

  const fetchLookups = async () => {
    setLoadingLookups(true);
    try {
      const [seasons, venues, eventTypes, languages, contributorTypes] =
        await Promise.all([
          api.get("/api/seasons").then((r) => r.json()),
          api.get("/api/venues").then((r) => r.json()),
          api.get("/api/eventtypes").then((r) => r.json()),
          api.get("/api/languages").then((r) => r.json()),
          api.get("/api/contributortypes").then((r) => r.json()),
        ]);
      setLookups({ seasons, venues, eventTypes, languages, contributorTypes });
    } catch {
      setProductionError("Failed to load form options.");
    } finally {
      setLoadingLookups(false);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const res = await api.get("/api/characters");
      if (res.ok) setAllCharacters(await res.json());
    } catch {
      /* ignore */
    }
  };

  const fetchPositions = async (contributorTypeId: string) => {
    if (!contributorTypeId || positionsByType[contributorTypeId]) return;
    try {
      const res = await api.get(
        `/api/positions?contributorTypeId=${contributorTypeId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPositionsByType((prev) => ({ ...prev, [contributorTypeId]: data }));
      }
    } catch {
      /* ignore */
    }
  };

  // ── Fetch on open ──
  useEffect(() => {
    if (!isOpen) return;
    fetchOperas();
    fetchLookups();
    fetchAllCharacters();
    setCrewRows([makeCrewRow()]);
  }, [isOpen]);

  // ── Step 0: Opera ──
  const handleSaveNewOpera = async () => {
    if (!newOpera.title.trim()) {
      setOperaError("Title is required.");
      return;
    }
    setSavingOpera(true);
    setOperaError(null);
    try {
      const res = await api.post("/api/operas", {
        title: newOpera.title.trim(),
        composer: newOpera.composer.trim() || null,
        librettist: newOpera.librettist.trim() || null,
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setOperas((prev) => [...prev, created]);
      setSelectedOperaId(created.id);
      setForm((prev) => ({ ...prev, title: created.title }));
      setShowAddOpera(false);
      setNewOpera({ title: "", composer: "", librettist: "" });
    } catch {
      setOperaError("Failed to save opera. Is the API running?");
    } finally {
      setSavingOpera(false);
    }
  };

  const handleOperaSelect = (operaId: number) => {
    setSelectedOperaId(operaId);
    const opera = operas.find((o) => o.id === operaId);
    if (opera && !form.title)
      setForm((prev) => ({ ...prev, title: opera.title }));
  };

  // ── Step 1: Inline lookup creation ──
  const handleSaveNewSeason = async () => {
    if (!newSeasonLabel.trim()) {
      setSeasonError("Label is required.");
      return;
    }
    setSavingSeason(true);
    setSeasonError(null);
    try {
      const res = await api.post("/api/seasons", {
        label: newSeasonLabel.trim(),
      });
      if (res.status === 409) {
        setSeasonError("A season with this label already exists.");
        return;
      }
      if (!res.ok) throw new Error();
      const created = await res.json();
      setLookups((prev) => ({
        ...prev,
        seasons: [...prev.seasons, created],
      }));
      setForm((prev) => ({ ...prev, seasonId: String(created.id) }));
      setNewSeasonLabel("");
      setShowAddSeason(false);
    } catch {
      setSeasonError("Failed to save season. Is the API running?");
    } finally {
      setSavingSeason(false);
    }
  };

  const handleSaveNewVenue = async () => {
    if (!newVenue.name.trim()) {
      setVenueError("Venue name is required.");
      return;
    }
    setSavingVenue(true);
    setVenueError(null);
    try {
      const res = await api.post("/api/venues", {
        name: newVenue.name.trim(),
        streetAddress: newVenue.streetAddress.trim() || null,
        city: newVenue.city.trim() || null,
        province: newVenue.province.trim() || null,
        postalCode: newVenue.postalCode.trim() || null,
        country: newVenue.country.trim() || null,
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setLookups((prev) => ({
        ...prev,
        venues: [...prev.venues, created],
      }));
      setForm((prev) => ({ ...prev, venueId: String(created.id) }));
      setNewVenue(EMPTY_VENUE);
      setShowAddVenue(false);
    } catch {
      setVenueError("Failed to save venue. Is the API running?");
    } finally {
      setSavingVenue(false);
    }
  };

  const handleSaveNewLanguage = async () => {
    if (!newLanguageName.trim()) {
      setLanguageError("Language name is required.");
      return;
    }
    setSavingLanguage(true);
    setLanguageError(null);
    try {
      const res = await api.post("/api/languages", {
        name: newLanguageName.trim(),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setLookups((prev) => ({
        ...prev,
        languages: [...prev.languages, created],
      }));
      setNewLanguageName("");
      setShowAddLanguage(false);
    } catch {
      setLanguageError("Failed to save language. Is the API running?");
    } finally {
      setSavingLanguage(false);
    }
  };

  // ── Step 1: Program PDF ──
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

  // ── Step 2: Characters ──
  const toggleCharacter = (id: number) => {
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSaveNewCharacter = async () => {
    if (!newCharacterName.trim()) {
      setCharacterError("Name is required.");
      return;
    }
    if (!selectedOperaId) {
      setCharacterError("Select an opera first.");
      return;
    }
    setSavingCharacter(true);
    setCharacterError(null);
    try {
      const res = await api.post("/api/characters", {
        name: newCharacterName.trim(),
        operaId: selectedOperaId,
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      // Stamp operaId locally in case the response omits it — otherwise the
      // new character is filtered straight back out of the list below.
      setAllCharacters((prev) => [
        ...prev,
        { ...created, operaId: created.operaId ?? selectedOperaId },
      ]);
      setSelectedCharacterIds((prev) => [...prev, created.id]);
      setNewCharacterName("");
      setShowAddCharacter(false);
    } catch {
      setCharacterError("Failed to save character.");
    } finally {
      setSavingCharacter(false);
    }
  };

  const initCastRows = () => {
    setCastRows(
      selectedCharacters.map((c) => ({
        id: newId(),
        characterId: c.id,
        characterName: c.name,
        personSearch: "",
        personId: "",
        personName: "",
      })),
    );
  };

  // ── Step 3: Person search ──
  const searchPersons = async (rowId: string, q: string, isCast: boolean) => {
    if (isCast)
      setCastRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, personSearch: q, personId: "", personName: "" }
            : r,
        ),
      );
    else
      setCrewRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, personSearch: q, personId: "", personName: "" }
            : r,
        ),
      );
    if (q.trim().length < 2) {
      setPersonResults((prev) => ({ ...prev, [rowId]: [] }));
      return;
    }
    try {
      const res = await api.get(`/api/persons?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPersonResults((prev) => ({ ...prev, [rowId]: data }));
      }
    } catch {
      /* ignore */
    }
  };

  const selectPerson = (
    rowId: string,
    person: PersonSearchResult,
    isCast: boolean,
  ) => {
    const name = `${person.firstName} ${person.lastName}`;
    if (isCast)
      setCastRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                personId: String(person.id),
                personName: name,
                personSearch: name,
              }
            : r,
        ),
      );
    else
      setCrewRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                personId: String(person.id),
                personName: name,
                personSearch: name,
              }
            : r,
        ),
      );
    setPersonResults((prev) => ({ ...prev, [rowId]: [] }));
  };

  // ── Step 4: Save ──
  const handleSave = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setPdfUploadWarning(null);
    try {
      const prodRes = await api.post("/api/productions", {
        title: form.title.trim(),
        seasonId: Number(form.seasonId),
        eventTypeId: Number(form.eventTypeId),
        venueId: Number(form.venueId),
        operaId: selectedOperaId ?? null,
        writtenLanguageId: form.writtenLanguageId
          ? Number(form.writtenLanguageId)
          : null,
        sungLanguageId: form.sungLanguageId
          ? Number(form.sungLanguageId)
          : null,
        runtimeMinutes: form.runtimeMinutes
          ? Number(form.runtimeMinutes)
          : null,
        notes: form.notes.trim() || null,
        programPdfUrl: null,
      });
      if (!prodRes.ok) throw new Error("Failed to create production.");
      const created = await prodRes.json();

      const castAppearances = castRows
        .filter((r) => r.personId)
        .map((r) =>
          api.post("/api/appearances", {
            productionId: created.id,
            personId: Number(r.personId),
            characterId: r.characterId,
          }),
        );

      const crewAppearances = crewRows
        .filter((r) => r.personId && r.contributorTypeId)
        .map((r) =>
          api.post("/api/appearances", {
            productionId: created.id,
            personId: Number(r.personId),
            contributorTypeId: Number(r.contributorTypeId),
            positionId: r.positionId ? Number(r.positionId) : null,
          }),
        );

      await Promise.allSettled([...castAppearances, ...crewAppearances]);

      // Upload the program PDF, if one was selected.
      if (programPdfFile) {
        try {
          const uploadRes = await uploadFile(
            `/api/uploads/program-pdf/${created.id}`,
            programPdfFile,
            "file",
          );
          if (!uploadRes.ok) {
            setPdfUploadWarning(
              "Production was saved, but the program PDF failed to upload. You can add it later from Edit Production.",
            );
          }
        } catch {
          setPdfUploadWarning(
            "Production was saved, but the program PDF failed to upload. You can add it later from Edit Production.",
          );
        }
      }

      setDone(true);
    } catch (e: any) {
      setSubmitError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedOperaId(null);
    setShowAddOpera(false);
    setNewOpera({ title: "", composer: "", librettist: "" });
    setForm(EMPTY_PRODUCTION);
    setShowAddSeason(false);
    setNewSeasonLabel("");
    setSeasonError(null);
    setShowAddVenue(false);
    setNewVenue(EMPTY_VENUE);
    setVenueError(null);
    setShowAddLanguage(false);
    setNewLanguageName("");
    setLanguageError(null);
    setProgramPdfFile(null);
    setPdfError(null);
    setSelectedCharacterIds([]);
    setCastRows([]);
    setCrewRows([makeCrewRow()]);
    setPersonResults({});
    setPositionsByType({});
    setSubmitError(null);
    setPdfUploadWarning(null);
    setDone(false);
    setOperaError(null);
    setProductionError(null);
    setCharacterError(null);
    onClose();
  };

  const handleDone = () => {
    onSuccess?.();
    handleClose();
  };

  if (!isOpen) return null;

  // ── Sub-components ──
  const StepIndicator = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1.75rem",
        marginTop: "4px",
      }}
    >
      {STEPS.map((label, i) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < STEPS.length - 1 ? 1 : 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: i <= step ? "#9B1C1C" : "#e5e7eb",
                color: i <= step ? "#fff" : "#9ca3af",
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: "10px",
                color: i === step ? "#9B1C1C" : "#9ca3af",
                fontWeight: i === step ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: "1px",
                background: i < step ? "#9B1C1C" : "#e5e7eb",
                margin: "0 6px",
                marginBottom: "16px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const Footer = ({
    onBack,
    onNext,
    nextLabel = "Next →",
    nextDisabled = false,
    nextLoading = false,
  }: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    nextLoading?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "1.75rem",
        paddingTop: "1rem",
        borderTop: "1px solid #f3f4f6",
      }}
    >
      <div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              fontSize: "12px",
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            ← Back
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleClose}
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
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: nextDisabled ? "not-allowed" : "pointer",
            border: "1px solid #9B1C1C",
            background: nextDisabled ? "#f3f4f6" : "#9B1C1C",
            color: nextDisabled ? "#9ca3af" : "#fff",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {nextLoading ? "Saving..." : nextLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
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
          maxWidth: "580px",
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
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>
            Add Production
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

        <StepIndicator />

        {/* ── Step 0: Opera ── */}
        {step === 0 && (
          <>
            {!loadingLookups && (
              <div style={fieldWrap}>
                <label style={labelStyle}>
                  Event Type <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <Dropdown
                  {...DD}
                  placeholder="Select type"
                  ariaLabel="Event type"
                  value={form.eventTypeId}
                  options={eventTypeOptions}
                  onChange={(v) => setForm((p) => ({ ...p, eventTypeId: v }))}
                />
              </div>
            )}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                Opera{" "}
                {requiresOpera ? (
                  <span style={{ color: "#9B1C1C" }}>*</span>
                ) : (
                  <span
                    style={{
                      color: "#9ca3af",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      fontSize: "11px",
                    }}
                  >
                    {" "}
                    — optional for this event type
                  </span>
                )}
              </label>
              {/* Clearing used to run Number("") → handleOperaSelect(0), which
                  set selectedOperaId to 0 instead of null. */}
              <Dropdown
                {...DD}
                placeholder="Select opera"
                ariaLabel="Opera"
                value={selectedOperaId != null ? String(selectedOperaId) : ""}
                options={operaOptions}
                onChange={(v) => {
                  if (!v) {
                    setSelectedOperaId(null);
                    return;
                  }
                  handleOperaSelect(Number(v));
                }}
              />
            </div>

            {!showAddOpera ? (
              <button
                onClick={() => setShowAddOpera(true)}
                style={{
                  fontSize: "12px",
                  color: "#9B1C1C",
                  background: "none",
                  border: "1px dashed #fca5a5",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  marginBottom: "1rem",
                }}
              >
                + Add new opera
              </button>
            ) : (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
                  >
                    New Opera
                  </span>
                  <button
                    onClick={() => {
                      setShowAddOpera(false);
                      setOperaError(null);
                    }}
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Title <span style={{ color: "#9B1C1C" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. La Traviata"
                    style={inputStyle}
                    value={newOpera.title}
                    onChange={(e) =>
                      setNewOpera((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Composer</label>
                    <input
                      type="text"
                      placeholder="e.g. Verdi"
                      style={inputStyle}
                      value={newOpera.composer}
                      onChange={(e) =>
                        setNewOpera((p) => ({ ...p, composer: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Librettist</label>
                    <input
                      type="text"
                      placeholder="e.g. Piave"
                      style={inputStyle}
                      value={newOpera.librettist}
                      onChange={(e) =>
                        setNewOpera((p) => ({
                          ...p,
                          librettist: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                {operaError && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9B1C1C",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {operaError}
                  </div>
                )}
                <button
                  onClick={handleSaveNewOpera}
                  disabled={savingOpera}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "7px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: "1px solid #9B1C1C",
                    background: "#9B1C1C",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {savingOpera ? "Saving..." : "Save Opera"}
                </button>
              </div>
            )}

            <Footer
              onNext={() => setStep(1)}
              nextLabel="Next: Details →"
              nextDisabled={
                !form.eventTypeId || (requiresOpera && !selectedOperaId)
              }
            />
          </>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
              {selectedOpera && form.title !== selectedOpera.title && (
                <button
                  onClick={() =>
                    setForm((p) => ({ ...p, title: selectedOpera!.title }))
                  }
                  style={{
                    fontSize: "11px",
                    color: "#9B1C1C",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "4px",
                    padding: 0,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Reset to "{selectedOpera.title}"
                </button>
              )}
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
                  onChange={(v) => setForm((p) => ({ ...p, seasonId: v }))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Venue <span style={{ color: "#9B1C1C" }}>*</span>
                </label>
                <Dropdown
                  {...DD}
                  placeholder="Select venue"
                  ariaLabel="Venue"
                  value={form.venueId}
                  options={venueOptions}
                  onChange={(v) => setForm((p) => ({ ...p, venueId: v }))}
                />
              </div>
            </div>

            {/* Inline add: season / venue */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "1.1rem",
                flexWrap: "wrap",
              }}
            >
              {!showAddSeason && (
                <button
                  onClick={() => setShowAddSeason(true)}
                  style={addLookupBtnStyle}
                >
                  + Add new season
                </button>
              )}
              {!showAddVenue && (
                <button
                  onClick={() => setShowAddVenue(true)}
                  style={addLookupBtnStyle}
                >
                  + Add new venue
                </button>
              )}
            </div>

            {showAddSeason && (
              <div style={accordionBoxStyle}>
                <div style={accordionHeadStyle}>
                  <span style={accordionTitleStyle}>New Season</span>
                  <button
                    onClick={() => {
                      setShowAddSeason(false);
                      setSeasonError(null);
                    }}
                    style={accordionCancelStyle}
                  >
                    Cancel
                  </button>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Label <span style={{ color: "#9B1C1C" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-2027"
                    style={inputStyle}
                    value={newSeasonLabel}
                    onChange={(e) => setNewSeasonLabel(e.target.value)}
                  />
                </div>
                {seasonError && (
                  <div style={accordionErrStyle}>{seasonError}</div>
                )}
                <button
                  onClick={handleSaveNewSeason}
                  disabled={savingSeason}
                  style={accordionSaveStyle}
                >
                  {savingSeason ? "Saving..." : "Save Season"}
                </button>
              </div>
            )}

            {showAddVenue && (
              <div style={accordionBoxStyle}>
                <div style={accordionHeadStyle}>
                  <span style={accordionTitleStyle}>New Venue</span>
                  <button
                    onClick={() => {
                      setShowAddVenue(false);
                      setVenueError(null);
                    }}
                    style={accordionCancelStyle}
                  >
                    Cancel
                  </button>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Name <span style={{ color: "#9B1C1C" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Southern Alberta Jubilee Auditorium"
                    style={inputStyle}
                    value={newVenue.name}
                    onChange={(e) =>
                      setNewVenue((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 1415 14 Ave NW"
                    style={inputStyle}
                    value={newVenue.streetAddress}
                    onChange={(e) =>
                      setNewVenue((p) => ({
                        ...p,
                        streetAddress: e.target.value,
                      }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      placeholder="e.g. Calgary"
                      style={inputStyle}
                      value={newVenue.city}
                      onChange={(e) =>
                        setNewVenue((p) => ({ ...p, city: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Province</label>
                    <input
                      type="text"
                      placeholder="e.g. AB"
                      style={inputStyle}
                      value={newVenue.province}
                      onChange={(e) =>
                        setNewVenue((p) => ({ ...p, province: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. T2N 1M4"
                      style={inputStyle}
                      value={newVenue.postalCode}
                      onChange={(e) =>
                        setNewVenue((p) => ({
                          ...p,
                          postalCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input
                      type="text"
                      placeholder="e.g. Canada"
                      style={inputStyle}
                      value={newVenue.country}
                      onChange={(e) =>
                        setNewVenue((p) => ({ ...p, country: e.target.value }))
                      }
                    />
                  </div>
                </div>
                {venueError && <div style={accordionErrStyle}>{venueError}</div>}
                <button
                  onClick={handleSaveNewVenue}
                  disabled={savingVenue}
                  style={accordionSaveStyle}
                >
                  {savingVenue ? "Saving..." : "Save Venue"}
                </button>
              </div>
            )}

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
                  onChange={(v) =>
                    setForm((p) => ({ ...p, writtenLanguageId: v }))
                  }
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
                  onChange={(v) => setForm((p) => ({ ...p, sungLanguageId: v }))}
                />
              </div>
            </div>

            {/* Inline add: language */}
            {!showAddLanguage ? (
              <button
                onClick={() => setShowAddLanguage(true)}
                style={{ ...addLookupBtnStyle, marginBottom: "1.1rem" }}
              >
                + Add new language
              </button>
            ) : (
              <div style={accordionBoxStyle}>
                <div style={accordionHeadStyle}>
                  <span style={accordionTitleStyle}>New Language</span>
                  <button
                    onClick={() => {
                      setShowAddLanguage(false);
                      setLanguageError(null);
                    }}
                    style={accordionCancelStyle}
                  >
                    Cancel
                  </button>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Name <span style={{ color: "#9B1C1C" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Italian"
                    style={inputStyle}
                    value={newLanguageName}
                    onChange={(e) => setNewLanguageName(e.target.value)}
                  />
                </div>
                {languageError && (
                  <div style={accordionErrStyle}>{languageError}</div>
                )}
                <button
                  onClick={handleSaveNewLanguage}
                  disabled={savingLanguage}
                  style={accordionSaveStyle}
                >
                  {savingLanguage ? "Saving..." : "Save Language"}
                </button>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "0.5rem",
                    marginBottom: 0,
                  }}
                >
                  New languages become available in both the Written and Sung
                  dropdowns above.
                </p>
              </div>
            )}

            <div style={fieldWrap}>
              <label style={labelStyle}>Runtime (minutes)</label>
              <input
                type="number"
                placeholder="e.g. 150"
                style={inputStyle}
                value={form.runtimeMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, runtimeMinutes: e.target.value }))
                }
                min={0}
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Notes</label>
              <textarea
                placeholder="Any additional notes..."
                style={{ ...inputStyle, resize: "vertical", minHeight: "68px" }}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
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
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  >
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
                  Click to upload program PDF (optional, max 50MB)
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={handlePdfChange}
                  />
                </label>
              )}
              {pdfError && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9B1C1C",
                    marginTop: "4px",
                  }}
                >
                  {pdfError}
                </div>
              )}
            </div>

            {productionError && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#9B1C1C",
                  marginBottom: "0.75rem",
                }}
              >
                {productionError}
              </div>
            )}
            <Footer
              onBack={() => setStep(0)}
              onNext={() => {
                if (!canAdvanceStep2) {
                  setProductionError("Please fill in all required fields.");
                  return;
                }
                setProductionError(null);
                setStep(2);
              }}
              nextLabel="Next: Characters →"
              nextDisabled={!canAdvanceStep2}
            />
          </>
        )}

        {/* ── Step 2: Characters ── */}
        {step === 2 && (
          <>
            {!selectedOperaId ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                No opera selected — you can skip this step.
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "1rem",
                  }}
                >
                  Select characters from <strong>{selectedOpera?.title}</strong>{" "}
                  that appear in this production.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginBottom: "1rem",
                    maxHeight: "260px",
                    overflowY: "auto",
                  }}
                >
                  {operaCharacters.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                      No characters found for this opera.
                    </p>
                  ) : (
                    operaCharacters.map((c) => {
                      const selected = selectedCharacterIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleCharacter(c.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: `1px solid ${selected ? "#9B1C1C" : "#e5e7eb"}`,
                            background: selected ? "#fef2f2" : "#fff",
                            transition: "all 0.1s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "3px",
                              flexShrink: 0,
                              border: `1.5px solid ${selected ? "#9B1C1C" : "#d1d5db"}`,
                              background: selected ? "#9B1C1C" : "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected && (
                              <svg
                                width="10"
                                height="8"
                                viewBox="0 0 10 8"
                                fill="none"
                              >
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="#fff"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              color: selected ? "#9B1C1C" : "#111",
                              fontWeight: selected ? 500 : 400,
                            }}
                          >
                            {c.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {!showAddCharacter ? (
                  <button
                    onClick={() => setShowAddCharacter(true)}
                    style={{
                      fontSize: "12px",
                      color: "#9B1C1C",
                      background: "none",
                      border: "1px dashed #fca5a5",
                      borderRadius: "6px",
                      padding: "7px 14px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      marginBottom: "0.5rem",
                    }}
                  >
                    + Add missing character
                  </button>
                ) : (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-end",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Character Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Violetta"
                          style={inputStyle}
                          value={newCharacterName}
                          onChange={(e) => setNewCharacterName(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleSaveNewCharacter}
                        disabled={savingCharacter}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "8px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: "1px solid #9B1C1C",
                          background: "#9B1C1C",
                          color: "#fff",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {savingCharacter ? "..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCharacter(false);
                          setNewCharacterName("");
                        }}
                        style={{
                          fontSize: "12px",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          color: "#6b7280",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    {characterError && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9B1C1C",
                          marginTop: "0.5rem",
                        }}
                      >
                        {characterError}
                      </div>
                    )}
                  </div>
                )}
                {selectedCharacterIds.length > 0 && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    {selectedCharacterIds.length} character
                    {selectedCharacterIds.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </>
            )}
            <Footer
              onBack={() => setStep(1)}
              onNext={() => {
                initCastRows();
                setStep(3);
              }}
              nextLabel="Next: Cast & Crew →"
            />
          </>
        )}

        {/* ── Step 3: Cast & Crew ── */}
        {step === 3 && (
          <>
            {castRows.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#9ca3af",
                    marginBottom: "0.75rem",
                  }}
                >
                  Cast
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "1.25rem",
                  }}
                >
                  {castRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "10px",
                      }}
                    >
                      <div style={{ flex: 1, position: "relative" }}>
                        <label style={labelStyle}>{row.characterName}</label>
                        <input
                          type="text"
                          placeholder="Search person…"
                          style={inputStyle}
                          value={row.personSearch}
                          onChange={(e) =>
                            searchPersons(row.id, e.target.value, true)
                          }
                        />
                        {(personResults[row.id]?.length ?? 0) > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 10,
                              maxHeight: "140px",
                              overflowY: "auto",
                            }}
                          >
                            {personResults[row.id].map((p) => (
                              <div
                                key={p.id}
                                onClick={() => selectPerson(row.id, p, true)}
                                style={{
                                  padding: "7px 12px",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  color: "#111",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f9fafb")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                {p.firstName} {p.lastName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                marginBottom: "0.75rem",
              }}
            >
              Creative / Crew
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "0.75rem",
              }}
            >
              {crewRows.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    border: "1px solid #f3f4f6",
                    borderRadius: "8px",
                    padding: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      Member {idx + 1}
                    </span>
                    {crewRows.length > 1 && (
                      <button
                        onClick={() =>
                          setCrewRows((prev) =>
                            prev.filter((r) => r.id !== row.id),
                          )
                        }
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <label style={labelStyle}>Person</label>
                      <input
                        type="text"
                        placeholder="Search…"
                        style={inputStyle}
                        value={row.personSearch}
                        onChange={(e) =>
                          searchPersons(row.id, e.target.value, false)
                        }
                      />
                      {(personResults[row.id]?.length ?? 0) > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 10,
                            maxHeight: "120px",
                            overflowY: "auto",
                          }}
                        >
                          {personResults[row.id].map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectPerson(row.id, p, false)}
                              style={{
                                padding: "7px 12px",
                                fontSize: "13px",
                                cursor: "pointer",
                                color: "#111",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f9fafb")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              {p.firstName} {p.lastName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Type</label>
                      <Dropdown
                        {...DD}
                        placeholder="Select"
                        ariaLabel="Contributor type"
                        value={row.contributorTypeId}
                        options={contributorTypeOptions}
                        onChange={(v) => {
                          setCrewRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, contributorTypeId: v, positionId: "" }
                                : r,
                            ),
                          );
                          fetchPositions(v);
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Position</label>
                      {/* Reads this row's own cached positions, so another
                          row changing Type can't empty this one out. */}
                      <Dropdown
                        {...DD}
                        placeholder="Select"
                        ariaLabel="Position"
                        disabled={!row.contributorTypeId}
                        value={row.positionId}
                        options={(
                          positionsByType[row.contributorTypeId] ?? []
                        ).map((p) => ({
                          value: String(p.id),
                          label: p.name,
                        }))}
                        onChange={(v) =>
                          setCrewRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, positionId: v } : r,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCrewRows((prev) => [...prev, makeCrewRow()])}
              style={{
                fontSize: "12px",
                color: "#9B1C1C",
                background: "none",
                border: "1px dashed #fca5a5",
                borderRadius: "6px",
                padding: "7px 14px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                width: "100%",
                marginBottom: "0.5rem",
              }}
            >
              + Add crew member
            </button>
            <Footer
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              nextLabel="Next: Review →"
            />
          </>
        )}

        {/* ── Step 4: Review & Save ── */}
        {step === 4 &&
          (done ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "0.75rem" }}>✓</div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111",
                  marginBottom: "4px",
                }}
              >
                Production saved!
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "1.5rem",
                }}
              >
                {form.title} has been added to the archive.
              </p>
              {pdfUploadWarning && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9B1C1C",
                    marginBottom: "1rem",
                    padding: "8px 12px",
                    background: "#fef2f2",
                    borderRadius: "6px",
                    border: "1px solid #fecaca",
                    textAlign: "left",
                  }}
                >
                  {pdfUploadWarning}
                </div>
              )}
              <button
                onClick={handleDone}
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "9px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "1px solid #9B1C1C",
                  background: "#9B1C1C",
                  color: "#fff",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#9ca3af",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Production
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#111",
                      marginBottom: "2px",
                    }}
                  >
                    {form.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {[
                      lookups.seasons.find(
                        (s) => String(s.id) === form.seasonId,
                      )?.label,
                      selectedEventType?.name,
                      lookups.venues.find((v) => String(v.id) === form.venueId)
                        ?.name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {selectedOpera && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginTop: "4px",
                      }}
                    >
                      Opera: {selectedOpera.title}
                    </div>
                  )}
                  {programPdfFile && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginTop: "4px",
                      }}
                    >
                      Program PDF: {programPdfFile.name}
                    </div>
                  )}
                </div>
                {selectedCharacters.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#9ca3af",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Characters ({selectedCharacters.length})
                    </div>
                    <div style={{ fontSize: "13px", color: "#374151" }}>
                      {selectedCharacters.map((c) => c.name).join(", ")}
                    </div>
                  </div>
                )}
                {castRows.filter((r) => r.personId).length > 0 && (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#9ca3af",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Cast
                    </div>
                    {castRows
                      .filter((r) => r.personId)
                      .map((r) => (
                        <div
                          key={r.id}
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            marginBottom: "2px",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {r.personName}
                          </span>{" "}
                          — {r.characterName}
                        </div>
                      ))}
                  </div>
                )}
                {crewRows.filter((r) => r.personId).length > 0 && (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#9ca3af",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Crew
                    </div>
                    {crewRows
                      .filter((r) => r.personId)
                      .map((r) => (
                        <div
                          key={r.id}
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            marginBottom: "2px",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {r.personName}
                          </span>
                          {r.contributorTypeId &&
                            ` — ${lookups.contributorTypes.find((t) => String(t.id) === r.contributorTypeId)?.name ?? ""}`}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {submitError && (
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
                  {submitError}
                </div>
              )}
              <Footer
                onBack={() => setStep(3)}
                onNext={handleSave}
                nextLabel="Save Production"
                nextLoading={submitting}
              />
            </>
          ))}
      </div>
    </div>
  );
};

export default AddProductionModal;