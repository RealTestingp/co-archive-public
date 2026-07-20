import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

// Normalized lookup option — backends return name / label / title, so we flatten.
interface Option {
  id: number;
  name: string;
}

type ReportMode = "List" | "Count";

// Maps each request-DTO key to its label + lookup endpoint.
const FILTERS: {
  key: keyof Selected;
  label: string;
  endpoint: string;
}[] = [
  { key: "SeasonId", label: "Season", endpoint: "/api/seasons" },
  {
    key: "ContributorTypeId",
    label: "Contributor Type",
    endpoint: "/api/contributortypes",
  },
  { key: "NationalityId", label: "Nationality", endpoint: "/api/nationalities" },
  { key: "PositionId", label: "Position", endpoint: "/api/positions" },
  { key: "CharacterId", label: "Character", endpoint: "/api/characters" },
  { key: "ProductionId", label: "Production", endpoint: "/api/productions" },
  { key: "EventTypeId", label: "Event Type", endpoint: "/api/eventtypes" },
  { key: "VoiceTypeId", label: "Voice Type", endpoint: "/api/voicetypes" },
];

interface Selected {
  SeasonId: string;
  ContributorTypeId: string;
  NationalityId: string;
  PositionId: string;
  CharacterId: string;
  ProductionId: string;
  EventTypeId: string;
  VoiceTypeId: string;
}

const EMPTY_SELECTED: Selected = {
  SeasonId: "",
  ContributorTypeId: "",
  NationalityId: "",
  PositionId: "",
  CharacterId: "",
  ProductionId: "",
  EventTypeId: "",
  VoiceTypeId: "",
};

const normalize = (item: Record<string, unknown>): Option => ({
  id: Number(item.id),
  name: String(item.name ?? item.label ?? item.title ?? item.id),
});

// Filters that only make sense for certain contributor types.
const CONDITIONAL_KEYS: (keyof Selected)[] = [
  "CharacterId",
  "VoiceTypeId",
  "PositionId",
];

// Given a contributor-type name, which conditional filters apply?
// Keyword-matched so it works regardless of exact DB naming; unknown names
// keep everything enabled so nothing valid is hidden.
const applicableFields = (typeName: string): Set<keyof Selected> => {
  const n = typeName.toLowerCase();
  const fields = new Set<keyof Selected>();
  if (/artist|mcphee|cast|principal|soloist/.test(n)) {
    fields.add("CharacterId");
    fields.add("VoiceTypeId");
  } else if (/chorus|choir/.test(n)) {
    fields.add("VoiceTypeId");
  } else if (/orchestra|musician|instrument/.test(n)) {
    // instrumentalists — no character, voice type, or crew position
  } else if (/creative|crew|staff|board|director|design|manage|technical/.test(n)) {
    fields.add("PositionId");
  } else {
    CONDITIONAL_KEYS.forEach((k) => fields.add(k)); // unknown → don't restrict
  }
  return fields;
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, colors } = useTheme();

  // Coming back via "← Edit criteria" carries the previous selections so the
  // form repopulates instead of resetting.
  const restored = location.state as
    | { selected?: Selected; mode?: ReportMode }
    | null;

  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [selected, setSelected] = useState<Selected>(
    restored?.selected ?? EMPTY_SELECTED,
  );
  const [mode, setMode] = useState<ReportMode>(restored?.mode ?? "List");

  // Fetch every lookup in parallel; any endpoint that 404s just yields an empty
  // dropdown rather than breaking the page.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        FILTERS.map(async (f) => {
          try {
            const res = await api.get(f.endpoint);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items ?? []);
            return [f.key, list.map(normalize)] as const;
          } catch {
            return [f.key, [] as Option[]] as const;
          }
        }),
      );
      if (!cancelled) setOptions(Object.fromEntries(entries));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof Selected, value: string) =>
    setSelected((s) => ({ ...s, [key]: value }));

  const activeFilterCount = Object.values(selected).filter(Boolean).length;

  // Which conditional filters apply, based on the chosen contributor type.
  const contributorName = options.ContributorTypeId?.find(
    (o) => o.id === Number(selected.ContributorTypeId),
  )?.name;
  const supported =
    selected.ContributorTypeId && contributorName
      ? applicableFields(contributorName)
      : null;
  const isDisabled = (key: keyof Selected) =>
    supported != null && CONDITIONAL_KEYS.includes(key) && !supported.has(key);

  // Clear any now-irrelevant filter when the contributor type changes.
  useEffect(() => {
    if (!supported) return;
    setSelected((s) => {
      let changed = false;
      const next = { ...s };
      for (const k of CONDITIONAL_KEYS) {
        if (!supported.has(k) && next[k]) {
          next[k] = "";
          changed = true;
        }
      }
      return changed ? next : s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.ContributorTypeId, options]);

  const handleRun = () => {
    // Build the request DTO: "" -> undefined, otherwise numeric id.
    // Omit mode for List (the DTO defaults to List) so it works without the
    // string-enum converter; only send it explicitly for Count.
    const request: Record<string, unknown> = {};
    if (mode === "Count") request.mode = "Count";
    for (const f of FILTERS) {
      const v = selected[f.key];
      if (v) request[f.key.charAt(0).toLowerCase() + f.key.slice(1)] = Number(v);
    }

    // Human-readable summary of the chosen criteria for the results screen.
    const summary = FILTERS.filter((f) => selected[f.key]).map((f) => {
      const opt = options[f.key]?.find(
        (o) => o.id === Number(selected[f.key]),
      );
      return { label: f.label, value: opt?.name ?? selected[f.key] };
    });

    // `selected` rides along so the results page can hand it back to us.
    navigate("/reports/results", {
      state: { request, summary, mode, selected },
    });
  };

  const handleClear = () => {
    setSelected(EMPTY_SELECTED);
    setMode("List");
  };

  // ── Theme tokens ──
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: "38px",
    padding: "0 12px",
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    background: surface,
    color: textPrimary,
    outline: "none",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textMuted,
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        background: colors.background,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        color: textPrimary,
      }}
    >
      <NavBar />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 600,
            color: textPrimary,
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
          }}
        >
          Reports
        </h1>
        <p style={{ fontSize: "13px", color: textMuted, marginBottom: "2rem" }}>
          Build a custom report by choosing any combination of criteria below.
        </p>

        <SectionTitle>Criteria</SectionTitle>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          {FILTERS.map((f) => {
            const disabled = isDisabled(f.key);
            return (
              <div key={f.key} style={{ opacity: disabled ? 0.45 : 1 }}>
                <label style={labelStyle}>{f.label}</label>
                <select
                  value={selected[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={disabled}
                  title={
                    disabled
                      ? "Not applicable for the selected contributor type"
                      : undefined
                  }
                  style={{
                    ...selectStyle,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">{disabled ? "N/A" : "Any"}</option>
                  {(options[f.key] ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <Divider />

        <SectionTitle>Output</SectionTitle>
        <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
          {(["List", "Count"] as ReportMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  border: `1px solid ${active ? "#9B1C1C" : border}`,
                  background: active ? "#9B1C1C" : surface,
                  color: active ? "#fff" : textSecondary,
                }}
              >
                {m === "List" ? "List results" : "Count only"}
              </button>
            );
          })}
        </div>

        <Divider />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingTop: "0.5rem",
          }}
        >
          <button
            onClick={handleRun}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              border: "1px solid #9B1C1C",
              background: "#9B1C1C",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Run Report →
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClear}
              style={{
                fontSize: "13px",
                fontWeight: 500,
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                border: `1px solid ${border}`,
                background: surface,
                color: textSecondary,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Clear
            </button>
          )}
          <span style={{ fontSize: "12px", color: textMuted }}>
            {activeFilterCount === 0
              ? "No filters — report will include all records."
              : `${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} applied.`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;