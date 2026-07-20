import { useState, useEffect, useRef } from "react";
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

// ── Multi-select ──────────────────────────────────────────────────────────────
// Defined at module scope so it isn't remounted (and doesn't lose its open
// state) on every parent render.

interface MultiSelectProps {
  label: string;
  options: Option[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
  tokens: {
    surface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    hoverBg: string;
    isDark: boolean;
  };
}

const MultiSelect = ({
  label,
  options,
  value,
  onChange,
  disabled,
  tokens,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: number) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );

  const selectedNames = options
    .filter((o) => value.includes(o.id))
    .map((o) => o.name);

  const summary =
    selectedNames.length === 0
      ? "Any"
      : selectedNames.length <= 2
        ? selectedNames.join(", ")
        : `${selectedNames.length} selected`;

  return (
    <div ref={wrapRef} style={{ position: "relative", opacity: disabled ? 0.45 : 1 }}>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: tokens.textMuted,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={
          disabled
            ? "Not applicable for the selected contributor type"
            : selectedNames.join(", ")
        }
        style={{
          width: "100%",
          height: "38px",
          padding: "0 12px",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          textAlign: "left",
          border: `1px solid ${tokens.border}`,
          borderRadius: "6px",
          background: tokens.surface,
          color: value.length ? tokens.textPrimary : tokens.textMuted,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {disabled ? "N/A" : summary}
        </span>
        <span style={{ fontSize: "10px", color: tokens.textMuted }}>▾</span>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: "220px",
            overflowY: "auto",
            background: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: "8px",
            boxShadow: tokens.isDark
              ? "0 8px 24px rgba(0,0,0,0.5)"
              : "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 40,
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: "12px",
                fontSize: "12px",
                color: tokens.textMuted,
              }}
            >
              No options available.
            </div>
          ) : (
            <>
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#9B1C1C",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${tokens.border}`,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Clear selection
                </button>
              )}
              {options.map((o) => {
                const checked = value.includes(o.id);
                return (
                  <div
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = tokens.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: tokens.textPrimary,
                    }}
                  >
                    <span
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        borderRadius: "3px",
                        border: `1.5px solid ${checked ? "#9B1C1C" : tokens.border}`,
                        background: checked ? "#9B1C1C" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <svg
                          width="9"
                          height="7"
                          viewBox="0 0 10 8"
                          fill="none"
                          aria-hidden="true"
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
                    </span>
                    {o.name}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

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
  const hoverBg = isDark ? "#242424" : "#f9fafb";

  const tokens = {
    surface,
    border,
    textPrimary,
    textSecondary,
    textMuted,
    hoverBg,
    isDark,
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
              options={options[f.key] ?? []}
              value={selected[f.key]}
              onChange={(next) => setField(f.key, next)}
              disabled={isDisabled(f.key)}
              tokens={tokens}
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