import { useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/BreadCrumb";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { exportToPdf, exportToXlsx } from "../utils/ReportExport";

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

  const exportBtnStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    border: `1px solid ${border}`,
    background: surface,
    color: textSecondary,
    fontFamily: "Inter, sans-serif",
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
              onClick={() => navigate("/reports")}
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
            <button
              style={{ ...exportBtnStyle, opacity: result ? 1 : 0.4 }}
              onClick={() => handleExport("pdf")}
              disabled={!result}
            >
              Export PDF
            </button>
            <button
              style={{ ...exportBtnStyle, opacity: result ? 1 : 0.4 }}
              onClick={() => handleExport("xlsx")}
              disabled={!result}
            >
              Export XLSX
            </button>
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