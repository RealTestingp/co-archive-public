import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import MultiSelect from "../components/dropdown/MultiSelect";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

// Normalized lookup option — backends return name / label / title, so we flatten.
interface Option {
  id: number;
  name: string;
}

type ReportMode = "List" | "Count";

// Every filter is a multi-select array on the API now.
type FilterKey =
  | "SeasonIds"
  | "ContributorTypeIds"
  | "NationalityIds"
  | "PositionIds"
  | "CharacterIds"
  | "ProductionIds"
  | "EventTypeIds"
  | "VoiceTypeIds"
  | "WrittenLanguageIds"
  | "SungLanguageIds";

type Selected = Record<FilterKey, number[]>;

const FILTERS: { key: FilterKey; label: string; endpoint: string }[] = [
  { key: "SeasonIds", label: "Season", endpoint: "/api/seasons" },
  {
    key: "ContributorTypeIds",
    label: "Contributor Type",
    endpoint: "/api/contributortypes",
  },
  { key: "NationalityIds", label: "Nationality", endpoint: "/api/nationalities" },
  { key: "PositionIds", label: "Position", endpoint: "/api/positions" },
  { key: "CharacterIds", label: "Character", endpoint: "/api/characters" },
  { key: "ProductionIds", label: "Production", endpoint: "/api/productions" },
  { key: "EventTypeIds", label: "Event Type", endpoint: "/api/eventtypes" },
  { key: "VoiceTypeIds", label: "Voice Type", endpoint: "/api/voicetypes" },
  {
    key: "WrittenLanguageIds",
    label: "Written Language",
    endpoint: "/api/languages",
  },
  { key: "SungLanguageIds", label: "Sung Language", endpoint: "/api/languages" },
];

const EMPTY_SELECTED: Selected = {
  SeasonIds: [],
  ContributorTypeIds: [],
  NationalityIds: [],
  PositionIds: [],
  CharacterIds: [],
  ProductionIds: [],
  EventTypeIds: [],
  VoiceTypeIds: [],
  WrittenLanguageIds: [],
  SungLanguageIds: [],
};

// Filters that only make sense for certain contributor types.
const CONDITIONAL_KEYS: FilterKey[] = [
  "CharacterIds",
  "VoiceTypeIds",
  "PositionIds",
];

// Given a contributor-type name, which conditional filters apply?
// Keyword-matched so it works regardless of exact DB naming; unknown names
// keep everything enabled so nothing valid is hidden.
const applicableFields = (typeName: string): FilterKey[] => {
  const n = typeName.toLowerCase();
  if (/artist|mcphee|cast|principal|soloist/.test(n))
    return ["CharacterIds", "VoiceTypeIds"];
  if (/chorus|choir/.test(n)) return ["VoiceTypeIds"];
  if (/orchestra|musician|instrument/.test(n)) return [];
  if (/creative|crew|staff|board|director|design|manage|technical/.test(n))
    return ["PositionIds"];
  return CONDITIONAL_KEYS; // unknown → don't restrict
};

const normalize = (item: Record<string, unknown>): Option => ({
  id: Number(item.id),
  name: String(item.name ?? item.label ?? item.title ?? item.id),
});

const camel = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

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

  // Fetch each distinct endpoint once (languages is shared by two filters) and
  // populate that filter as soon as its own request returns. Deliberately NOT
  // Promise.all — one slow or failing endpoint shouldn't leave every dropdown
  // empty.
  useEffect(() => {
    let cancelled = false;
    const endpoints = Array.from(new Set(FILTERS.map((f) => f.endpoint)));

    endpoints.forEach(async (endpoint) => {
      let list: Option[] = [];
      try {
        const res = await api.get(endpoint);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : (data.items ?? []);
          list = arr.map(normalize);
        }
      } catch {
        /* leave this one empty, the others still populate */
      }
      if (cancelled) return;
      setOptions((prev) => {
        const next = { ...prev };
        for (const f of FILTERS) {
          if (f.endpoint === endpoint) next[f.key] = list;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: FilterKey, values: number[]) =>
    setSelected((s) => ({ ...s, [key]: values }));

  // MultiSelect speaks strings (same as Dropdown); the API and this page's
  // state speak numeric IDs. Convert at the boundary.
  const dropdownOptions = useMemo(() => {
    const map: Record<string, { value: string; label: string }[]> = {};
    for (const f of FILTERS) {
      map[f.key] = (options[f.key] ?? []).map((o) => ({
        value: String(o.id),
        label: o.name,
      }));
    }
    return map;
  }, [options]);

  const activeFilterCount = FILTERS.filter(
    (f) => selected[f.key].length > 0,
  ).length;

  // Which conditional filters apply — the union across every selected
  // contributor type, so picking Artist + Crew keeps both sides available.
  const selectedContributorNames = (options.ContributorTypeIds ?? [])
    .filter((o) => selected.ContributorTypeIds.includes(o.id))
    .map((o) => o.name);

  const supported: FilterKey[] | null = selectedContributorNames.length
    ? Array.from(
        new Set(selectedContributorNames.flatMap((n) => applicableFields(n))),
      )
    : null;

  const isDisabled = (key: FilterKey) =>
    supported != null && CONDITIONAL_KEYS.includes(key) && !supported.includes(key);

  // Clear any now-irrelevant filter when the contributor types change.
  useEffect(() => {
    if (!supported) return;
    setSelected((s) => {
      let changed = false;
      const next = { ...s };
      for (const k of CONDITIONAL_KEYS) {
        if (!supported.includes(k) && next[k].length) {
          next[k] = [];
          changed = true;
        }
      }
      return changed ? next : s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.ContributorTypeIds, options]);

  const handleRun = () => {
    // Omit mode for List (the DTO defaults to List); only send it for Count.
    const request: Record<string, unknown> = {};
    if (mode === "Count") request.mode = "Count";
    for (const f of FILTERS) {
      const vals = selected[f.key];
      if (vals.length) request[camel(f.key)] = vals;
    }

    // Human-readable summary of the chosen criteria for the results screen.
    const summary = FILTERS.filter((f) => selected[f.key].length > 0).map(
      (f) => ({
        label: f.label,
        value: (options[f.key] ?? [])
          .filter((o) => selected[f.key].includes(o.id))
          .map((o) => o.name)
          .join(", "),
      }),
    );

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
          Each filter accepts multiple values.
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
          {FILTERS.map((f) => (
            <MultiSelect
              key={f.key}
              label={f.label}
              placeholder="Any"
              options={dropdownOptions[f.key] ?? []}
              value={selected[f.key].map(String)}
              onChange={(next) => setField(f.key, next.map(Number))}
              disabled={isDisabled(f.key)}
              disabledHint="Not applicable for the selected contributor type"
            />
          ))}
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