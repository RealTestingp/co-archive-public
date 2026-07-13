import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/BreadCrumb";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import AddPersonModal from "../components/AddPersonModal";
import AddProductionModal from "../components/AddProductionModal";
import AddCharacterModal from "../components/AddCharacterModal";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

type Tab = "Persons" | "Productions" | "Characters";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  voiceType: string | null;
  contributorTypes: string[];
}

interface Production {
  id: number;
  title: string;
  season: string;
  eventType: string;
  venue: string;
  opera: string | null;
}

interface Character {
  id: number;
  name: string;
  operaTitle?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ManageArchivePage = () => {
  const { isDark, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("Persons");
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [persons, setPersons] = useState<Person[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  const navigate = useNavigate();

  const fetchData = useCallback(async (tab: Tab, searchTerm = "") => {
    setIsLoading(true);
    setHasError(false);
    try {
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      if (tab === "Persons") {
        const res = await api.get(`/api/persons${q}`);
        if (!res.ok) throw new Error();
        setPersons(await res.json());
      } else if (tab === "Productions") {
        const res = await api.get(`/api/productions${q}`);
        if (!res.ok) throw new Error();
        setProductions(await res.json());
      } else {
        const res = await api.get(`/api/characters${q}`);
        if (!res.ok) throw new Error();
        setCharacters(await res.json());
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, search);
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData(activeTab, search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch("");
    setPage(1);
  };

  const handleAddNew = () => {
    if (activeTab === "Persons") setIsPersonModalOpen(true);
    if (activeTab === "Productions") setIsProductionModalOpen(true);
    if (activeTab === "Characters") setIsCharacterModalOpen(true);
  };

  const handleView = (id: number) => {
    if (activeTab === "Persons") navigate(`/persons/${id}`);
    if (activeTab === "Productions") navigate(`/productions/${id}`);
    if (activeTab === "Characters") navigate(`/characters/${id}`);
  };

  const tabs: Tab[] = ["Persons", "Productions", "Characters"];

  // Active list for pagination
  const activeList =
    activeTab === "Persons"
      ? persons
      : activeTab === "Productions"
        ? productions
        : characters;

  const totalPages = Math.ceil(activeList.length / pageSize);
  const pagedList = activeList.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    Persons: persons.length,
    Productions: productions.length,
    Characters: characters.length,
  };

  // ── Styles (theme-aware) ──
  const bg = colors.background;
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    outline: "none",
    background: surface,
    color: textPrimary,
  };

  const editBtnStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    border: `1px solid ${border}`,
    background: surface,
    color: textSecondary,
    fontFamily: "Inter, sans-serif",
  };

  const viewBtnStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    border: "1px solid #9B1C1C",
    background: "#9B1C1C",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
  };

  const renderRows = () => {
    if (activeTab === "Persons") {
      return (pagedList as Person[]).map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom:
              i < pagedList.length - 1 ? `1px solid ${borderLight}` : "none",
          }}
        >
          <span
            style={{
              flex: 2,
              fontSize: "13px",
              fontWeight: 500,
              color: textPrimary,
            }}
          >
            {p.lastName}, {p.firstName}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.voiceType ?? "—"}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.contributorTypes.join(", ") || "—"}
          </span>
          <span style={{ flex: 1, fontSize: "13px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "3px",
                background: p.isActive
                  ? isDark
                    ? "#052e16"
                    : "#f0fdf4"
                  : isDark
                    ? "#1c1c1c"
                    : "#f9fafb",
                color: p.isActive ? "#16a34a" : textMuted,
              }}
            >
              {p.isActive ? "Active" : "Inactive"}
            </span>
          </span>
          <div
            style={{
              display: "flex",
              gap: "6px",
              minWidth: "100px",
              justifyContent: "flex-end",
            }}
          >
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(p.id)} style={viewBtnStyle}>
              View
            </button>
          </div>
        </div>
      ));
    }

    if (activeTab === "Productions") {
      return (pagedList as Production[]).map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom:
              i < pagedList.length - 1 ? `1px solid ${borderLight}` : "none",
          }}
        >
          <span
            style={{
              flex: 2,
              fontSize: "13px",
              fontWeight: 500,
              color: textPrimary,
            }}
          >
            {p.title}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.season}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.eventType}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.venue}
          </span>
          <div
            style={{
              display: "flex",
              gap: "6px",
              minWidth: "100px",
              justifyContent: "flex-end",
            }}
          >
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(p.id)} style={viewBtnStyle}>
              View
            </button>
          </div>
        </div>
      ));
    }

    if (activeTab === "Characters") {
      return (pagedList as Character[]).map((c, i) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom:
              i < pagedList.length - 1 ? `1px solid ${borderLight}` : "none",
          }}
        >
          <span
            style={{
              flex: 2,
              fontSize: "13px",
              fontWeight: 500,
              color: textPrimary,
            }}
          >
            {c.name}
          </span>
          <span style={{ flex: 2, fontSize: "13px", color: textSecondary }}>
            {c.operaTitle ?? "—"}
          </span>
          <div
            style={{
              display: "flex",
              gap: "6px",
              minWidth: "100px",
              justifyContent: "flex-end",
            }}
          >
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(c.id)} style={viewBtnStyle}>
              View
            </button>
          </div>
        </div>
      ));
    }
  };

  const tableHeaders = {
    Persons: ["Name", "Voice Type", "Contributor Type", "Status", ""],
    Productions: ["Title", "Season", "Event Type", "Venue", ""],
    Characters: ["Name", "Opera", ""],
  };

  const emptyMessage = {
    Persons: "No persons found.",
    Productions: "No productions found.",
    Characters: "No characters found.",
  };

  return (
    <div
      style={{
        background: bg,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        color: textPrimary,
      }}
    >
      <NavBar />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem" }}>
        <Breadcrumb
          path={[{ label: "Admin", to: "/manage" }]}
          current="Manage Archive"
        />

        <h1
          style={{
            fontSize: "26px",
            fontWeight: 600,
            color: textPrimary,
            letterSpacing: "-0.02em",
            marginBottom: "1.5rem",
          }}
        >
          Manage Archive
        </h1>

        {/* Stats */}
        <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
          {tabs.map((tab) => (
            <div key={tab}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                {isLoading && activeTab === tab ? (
                  <LoadingSkeleton width="48px" height="28px" />
                ) : (
                  counts[tab]
                )}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: textMuted,
                  marginTop: "4px",
                }}
              >
                {tab}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${border}`,
            marginBottom: "1.5rem",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 16px",
                cursor: "pointer",
                color: activeTab === tab ? "#9B1C1C" : textSecondary,
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #9B1C1C"
                    : "2px solid transparent",
                marginBottom: "-1px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "1.25rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />
          <button
            onClick={handleSearch}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              border: `1px solid ${border}`,
              background: surface,
              color: textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Search
          </button>
          <button
            onClick={handleAddNew}
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
            + Add New
          </button>
        </div>

        {/* Table header row with per-page control */}
        {!hasError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "12px", color: textMuted }}>
              {!isLoading && `${activeList.length} ${activeTab.toLowerCase()}`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: textMuted }}>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  height: "28px",
                  padding: "0 24px 0 8px",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  background: `${surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 8px center`,
                  color: textSecondary,
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "12px", color: textMuted }}>
                per page
              </span>
            </div>
          </div>
        )}

        {/* Table */}
        {hasError ? (
          <ErrorState onRetry={() => fetchData(activeTab, search)} />
        ) : (
          <>
            <div
              style={{
                border: `1px solid ${border}`,
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  background: tableBg,
                  borderBottom: `1px solid ${border}`,
                }}
              >
                {tableHeaders[activeTab].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      flex: h === "" ? 0 : i === 0 ? 2 : 1,
                      minWidth: h === "" ? "100px" : undefined,
                      textAlign: h === "" ? "right" : "left",
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: textMuted,
                    }}
                  >
                    {h === "" ? "Actions" : h}
                  </span>
                ))}
              </div>

              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "12px 16px",
                      borderBottom: i < 3 ? `1px solid ${borderLight}` : "none",
                    }}
                  >
                    <LoadingSkeleton width="100%" height="13px" />
                    <LoadingSkeleton width="100%" height="13px" />
                    <LoadingSkeleton width="100%" height="13px" />
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        minWidth: "100px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <LoadingSkeleton
                        width="40px"
                        height="26px"
                        borderRadius="4px"
                      />
                      <LoadingSkeleton
                        width="40px"
                        height="26px"
                        borderRadius="4px"
                      />
                    </div>
                  </div>
                ))
              ) : pagedList.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    fontSize: "13px",
                    color: textMuted,
                  }}
                >
                  {emptyMessage[activeTab]}
                </div>
              ) : (
                renderRows()
              )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  paddingTop: "1.25rem",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    fontSize: "13px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    padding: "7px 16px",
                    border: `1px solid ${border}`,
                    borderRadius: "6px",
                    background: surface,
                    color: textSecondary,
                    cursor: "pointer",
                    opacity: page === 1 ? 0.35 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "13px", color: textMuted }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    fontSize: "13px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    padding: "7px 16px",
                    border: `1px solid ${border}`,
                    borderRadius: "6px",
                    background: surface,
                    color: textSecondary,
                    cursor: "pointer",
                    opacity: page === totalPages ? 0.35 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AddPersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSuccess={() => fetchData("Persons", search)}
      />
      <AddProductionModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        onSuccess={() => fetchData("Productions", search)}
      />
      <AddCharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onSuccess={() => fetchData("Characters", search)}
      />
    </div>
  );
};

export default ManageArchivePage;
