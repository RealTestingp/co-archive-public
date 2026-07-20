import { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/ui/BreadCrumb";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { exportToPdf, exportToXlsx } from "../utils/reportExport";

interface ReportRow {
  fullName: string;
  email?: string | null;
  contributorType: string;
  position?: string | null;
  character?: string | null;
  production?: string | null;
  season?: string | null;
  nationality?: string | null;
  voiceType?: string | null;
}

interface ReportResult {
  rows: ReportRow[];
  totalCount: number;
}

interface LocationState {
  request: Record<string, unknown>;
  summary: { label: string; value: string }[];
  mode: "List" | "Count";
  // The raw form selections, passed straight back on "Edit criteria" so the
  // form repopulates rather than resetting.
  selected?: Record<string, string>;
}

// Column definitions in display order.
const COLUMNS: { key: keyof ReportRow; label: string }[] = [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "contributorType", label: "Contributor Type" },
  { key: "position", label: "Position" },
  { key: "character", label: "Character" },
  { key: "production", label: "Production" },
  { key: "season", label: "Season" },
  { key: "nationality", label: "Nationality" },
  { key: "voiceType", label: "Voice Type" },
];

const ReportResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, colors } = useTheme();
  const state = location.state as LocationState | null;

  const [result, setResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const runQuery = async () => {
    if (!state?.request) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await api.post("/api/reportsquery/query", state.request);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No criteria in navigation state (e.g. page opened directly) — bounce back.
  if (!state?.request) return <Navigate to="/reports" replace />;

  const isCount = state.mode === "Count";

  // ── Theme tokens ──
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";
  const surface = isDark ? "#1c1c1c" : "#fff";

  // Only render columns that have at least one non-empty value (keeps it tidy).
  const visibleColumns =
    result && result.rows.length
      ? COLUMNS.filter((c) => result.rows.some((r) => r[c.key]))
      : COLUMNS;

  const handleExport = (format: "pdf" | "xlsx") => {
    if (!result) return;
    const payload = {
      columns: visibleColumns.map((c) => ({ key: c.key, label: c.label })),
      rows: result.rows as unknown as Record<string, unknown>[],
      summary: state.summary,
      totalCount: result.totalCount,
      mode: state.mode,
    };
    if (format === "pdf") exportToPdf(payload);
    else exportToXlsx(payload);
  };

  // Export button: icon + label, accent-red hover, clear disabled state.
  const ExportButton = ({
    format,
    label,
    icon,
  }: {
    format: "pdf" | "xlsx";
    label: string;
    icon: React.ReactNode;
  }) => {
    const enabled = !!result;
    return (
      <button
        onClick={() => handleExport(format)}
        disabled={!enabled}
        onMouseEnter={(e) => {
          if (!enabled) return;
          // Fill solid accent red on hover so it reads as clearly clickable.
          e.currentTarget.style.borderColor = "#9B1C1C";
          e.currentTarget.style.background = "#9B1C1C";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          if (!enabled) return;
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.background = surface;
          e.currentTarget.style.color = textPrimary;
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 600,
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: enabled ? "pointer" : "not-allowed",
          border: `1px solid ${border}`,
          background: surface,
          color: enabled ? textPrimary : textMuted,
          fontFamily: "Inter, sans-serif",
          opacity: enabled ? 1 : 0.5,
          transition:
            "border-color 0.15s ease, color 0.15s ease, background 0.15s ease",
        }}
      >
        {icon}
        {label}
      </button>
    );
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
        <Breadcrumb
          path={[{ label: "Reports", to: "/reports" }]}
          current="Results"
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}
            >
              Report Results
            </h1>
            <button
              onClick={() =>
                navigate("/reports", {
                  state: { selected: state.selected, mode: state.mode },
                })
              }
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#9B1C1C",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              ← Edit criteria
            </button>
          </div>

          {/* Export */}
          <div style={{ display: "flex", gap: "8px" }}>
            <ExportButton
              format="pdf"
              label="Export PDF"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="13" y2="17" />
                </svg>
              }
            />
            <ExportButton
              format="xlsx"
              label="Export Excel"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="9" x2="9" y2="21" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Criteria summary */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "1.5rem",
          }}
        >
          {state.summary.length === 0 ? (
            <span style={{ fontSize: "12px", color: textMuted }}>
              All records (no filters)
            </span>
          ) : (
            state.summary.map((s) => (
              <span
                key={s.label}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: isDark ? "#2a1414" : "#fef2f2",
                  color: "#9B1C1C",
                  border: `1px solid ${isDark ? "#4a2020" : "#fecaca"}`,
                }}
              >
                {s.label}: {s.value}
              </span>
            ))
          )}
        </div>

        {hasError ? (
          <ErrorState onRetry={runQuery} />
        ) : isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <LoadingSkeleton key={i} width="100%" height="38px" />
            ))}
          </div>
        ) : isCount ? (
          // Count-only view
          <div
            style={{
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "2.5rem",
              textAlign: "center",
              background: surface,
            }}
          >
            <div
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#9B1C1C",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {result?.totalCount ?? 0}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: textMuted,
                marginTop: "8px",
              }}
            >
              Matching records
            </div>
          </div>
        ) : result && result.rows.length === 0 ? (
          <div
            style={{
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
              fontSize: "13px",
              color: textMuted,
            }}
          >
            No records match these criteria.
          </div>
        ) : (
          // List view
          <div
            style={{
              border: `1px solid ${border}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "760px" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    background: tableBg,
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  {visibleColumns.map((c) => (
                    <span
                      key={c.key}
                      style={{
                        flex: 1,
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: textMuted,
                      }}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {result?.rows.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      padding: "11px 16px",
                      borderBottom:
                        i < (result?.rows.length ?? 0) - 1
                          ? `1px solid ${borderLight}`
                          : "none",
                    }}
                  >
                    {visibleColumns.map((c) => (
                      <span
                        key={c.key}
                        style={{
                          flex: 1,
                          fontSize: "13px",
                          color:
                            c.key === "fullName" ? textPrimary : textSecondary,
                          fontWeight: c.key === "fullName" ? 500 : 400,
                        }}
                      >
                        {row[c.key] ?? "—"}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Total count — always pinned at the bottom */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "10px 16px",
                background: tableBg,
                borderTop: `1px solid ${border}`,
                fontSize: "12px",
                fontWeight: 600,
                color: textPrimary,
              }}
            >
              Total: {result?.totalCount ?? 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportResultsPage;