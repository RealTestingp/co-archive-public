/* ReportsPage.tsx
   The report builder. Ten filters, each accepting multiple values, plus a choice
   between listing the matching records or just counting them.

   How it works end to end:
   1. On mount, fetch the lookup lists that fill the dropdowns
   2. The user picks any combination of values
   3. Run Report packages the selections and navigates to /reports/results,
      which is what actually calls the API

   The filters are driven by the FILTERS array rather than written out ten times.
   Adding a filter is one entry in that array plus one key in the types, which is
   why the JSX below is a single map instead of ten near identical blocks.

   Note on styling: this page uses inline styles rather than CSS Modules like the
   rest of the app. That is an inconsistency, not a decision, and it is why the
   theme tokens have to be recomputed by hand near the bottom.
*/
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import MultiSelect from "../components/dropdown/MultiSelect";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

/* Normalised lookup option. The lookup endpoints do not agree on what the label
   field is called, so everything gets flattened to id and name on the way in. */
interface Option {
  id: number;
  name: string;
}

type ReportMode = "List" | "Count";

/* Every filter is an array of ids on the API side. Naming these as a union type
   rather than plain strings means a typo in a filter key is a compile error, and
   Selected below is guaranteed to have exactly these keys and no others. */
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

/* The single source of truth for the filters. Label drives the UI, endpoint
   drives the fetch, key drives both the state and the request body. Written
   Language and Sung Language deliberately share /api/languages, which the fetch
   below is written to handle. */
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

// Written out in full so the shape always matches Selected exactly.
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

/* Filters that only make sense for some contributor types. Asking for a Voice
   Type on an orchestral musician is meaningless, so these get disabled rather
   than silently returning nothing. */
const CONDITIONAL_KEYS: FilterKey[] = [
  "CharacterIds",
  "VoiceTypeIds",
  "PositionIds",
];

/* Given a contributor type name, which conditional filters apply.

   Matched on keywords rather than ids because the contributor type names come
   from the database and we did not want the frontend hardcoding primary keys
   that could change between environments.

   The tradeoff is real and worth naming: this is string matching, so a renamed
   contributor type silently falls through to the default. The default is
   deliberately permissive, unknown names keep every filter enabled, so the
   failure mode is showing a filter that does not apply rather than hiding one
   that does. */
const applicableFields = (typeName: string): FilterKey[] => {
  const n = typeName.toLowerCase();
  if (/artist|mcphee|cast|principal|soloist/.test(n))
    return ["CharacterIds", "VoiceTypeIds"];
  if (/chorus|choir/.test(n)) return ["VoiceTypeIds"];
  if (/orchestra|musician|instrument/.test(n)) return [];
  if (/creative|crew|staff|board|director|design|manage|technical/.test(n))
    return ["PositionIds"];
  return CONDITIONAL_KEYS; // unknown, so do not restrict anything
};

/* Flattens a lookup record to id and name. The fallback chain exists because
   the endpoints are inconsistent: some return name, some label, some title.
   Falling back to the id means a row always renders as something rather than
   appearing blank in the dropdown. */
const normalize = (item: Record<string, unknown>): Option => ({
  id: Number(item.id),
  name: String(item.name ?? item.label ?? item.title ?? item.id),
});

/* The filter keys are PascalCase to match the C# style of the backend DTO, but
   the JSON body wants camelCase, so this converts at the boundary. */
const camel = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

const ReportsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, colors } = useTheme();

  /* Coming back from the results screen via "Edit criteria" carries the previous
     selections in router state, so the form repopulates instead of resetting and
     making the user rebuild the whole report. */
  const restored = location.state as
    | { selected?: Selected; mode?: ReportMode }
    | null;

  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [selected, setSelected] = useState<Selected>(
    restored?.selected ?? EMPTY_SELECTED,
  );
  const [mode, setMode] = useState<ReportMode>(restored?.mode ?? "List");

  /* Load the dropdown contents.

     Deduplicated first, since Written Language and Sung Language share an
     endpoint and there is no reason to fetch it twice.

     Deliberately not Promise.all. Each request updates its own filter the moment
     it returns, so a slow endpoint does not hold up the other nine, and a failing
     one leaves a single dropdown empty instead of all of them. The catch is empty
     on purpose for that reason.

     The cancelled flag stops a late response calling setState after the user has
     navigated away, which React warns about and which would leak. */
  useEffect(() => {
    let cancelled = false;
    const endpoints = Array.from(new Set(FILTERS.map((f) => f.endpoint)));

    endpoints.forEach(async (endpoint) => {
      let list: Option[] = [];
      try {
        const res = await api.get(endpoint);
        if (res.ok) {
          const data = await res.json();
          // Some endpoints return a bare array, others wrap it in { items }.
          const arr = Array.isArray(data) ? data : (data.items ?? []);
          list = arr.map(normalize);
        }
      } catch {
        /* leave this one empty, the others still populate */
      }
      if (cancelled) return;
      // Assign to every filter using this endpoint, which is what covers the
      // two language filters sharing one fetch.
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

  /* MultiSelect works in strings, the same as Dropdown, because that is what DOM
     values are. The API and this page's state work in numeric ids. Converting in
     one place rather than inside the render keeps the boundary obvious, and the
     useMemo stops it rebuilding on every keystroke elsewhere on the page. */
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

  /* Work out which conditional filters currently apply.

     Takes the union across every selected contributor type, so choosing Artist
     and Crew together keeps both Character and Position available rather than
     letting one selection cancel out the other.

     supported is null when no contributor type is chosen, which is meaningfully
     different from an empty array. null means "no restriction yet", empty means
     "restricted to nothing". isDisabled below relies on that distinction. */
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

  /* Clear any filter that has just stopped being relevant.

     Without this, picking Artist, choosing a Character, then switching to
     Orchestra would leave the character id sitting in state, greyed out and
     invisible, but still sent to the API. The report would come back empty and
     the reason would be hidden.

     Returns the original object when nothing changed, so React skips the
     re-render rather than looping. */
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
    /* Build the request body. Only non empty filters are included, so the API
       receives just the criteria that were actually chosen rather than ten empty
       arrays it has to ignore.
       Mode is omitted for List because the backend DTO already defaults to it. */
    const request: Record<string, unknown> = {};
    if (mode === "Count") request.mode = "Count";
    for (const f of FILTERS) {
      const vals = selected[f.key];
      if (vals.length) request[camel(f.key)] = vals;
    }

    /* Readable version of the same criteria, resolved from ids back to names.
       This is what gets printed at the top of the exported PDF and spreadsheet,
       so the export explains itself once it has left the app. */
    const summary = FILTERS.filter((f) => selected[f.key].length > 0).map(
      (f) => ({
        label: f.label,
        value: (options[f.key] ?? [])
          .filter((o) => selected[f.key].includes(o.id))
          .map((o) => o.name)
          .join(", "),
      }),
    );

    /* Passed through router state rather than the URL. Ten multi value filters
       would make an unreadable query string, and the results page needs the
       resolved names too. The cost is that the results URL is not shareable or
       bookmarkable, and a refresh there loses the criteria. */
    navigate("/reports/results", {
      state: { request, summary, mode, selected },
    });
  };

  const handleClear = () => {
    setSelected(EMPTY_SELECTED);
    setMode("List");
  };

  /* Theme values, recomputed here because this page styles inline instead of
     using CSS Modules, so it cannot read the CSS custom properties the rest of
     the app uses. */
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

        {/* All ten filters from one map. This is the payoff of the FILTERS array:
            adding a filter never touches this JSX. */}
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
              // String on the way out, number on the way back in.
              value={selected[f.key].map(String)}
              onChange={(next) => setField(f.key, next.map(Number))}
              disabled={isDisabled(f.key)}
              // Says why it is unavailable rather than just greying out.
              disabledHint="Not applicable for the selected contributor type"
            />
          ))}
        </div>

        <Divider />

        {/* List returns the matching rows, Count returns only the number. Count
            is much cheaper for questions like "how many productions in 2019". */}
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

          {/* Clear only appears once there is something to clear. */}
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

          {/* Says plainly that no filters means everything, so nobody runs a
              report expecting it to be narrower than it is. */}
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