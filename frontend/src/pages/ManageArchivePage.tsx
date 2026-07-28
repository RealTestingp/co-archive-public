/* ManageArchivePage.tsx
   The admin hub. Three tabs over the three record types, with search,
   pagination, and the entry point to every add modal.

   Admin only. The route is wrapped in AdminRoute inside ProtectedRoute in
   App.tsx, so a non admin is redirected to search before this ever renders.
   Worth repeating that this is a UI guard, not a security boundary.

   Two loading strategies, used deliberately:
   - fetchAll runs once on mount and loads all three tabs together, so the tab
     counts are correct immediately and switching tabs needs no request at all.
   - fetchData reloads a single tab, used for search and after a record is added
     or edited.

   loadedTabs and searchedTabs are what make the tab switching feel instant.
   loadedTabs means skeletons only show on a tab's first load, so afterwards the
   existing rows stay on screen while data refreshes behind them rather than
   flashing empty. searchedTabs tracks which tabs are showing filtered results,
   so switching back to one restores the full list rather than leaving it
   mysteriously short.

   Both are Sets rather than booleans because the state is per tab, and both are
   copied rather than mutated on update, since React compares by reference and
   would not re-render on an in place Set.add.
*/
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/ui/BreadCrumb";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";
import Dropdown from "../components/dropdown/Dropdown";
import AddPersonModal from "../components/modals/AddPersonModal";
import AddProductionModal from "../components/modals/AddProductionModal";
import AddCharacterModal from "../components/modals/AddCharacterModal";
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
  // GET /api/characters projects the opera name as `opera` (Opera = c.Opera.Title),
  // not `operaTitle` — reading the wrong key showed "—" for every row.
  opera?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const TABS: Tab[] = ["Persons", "Productions", "Characters"];

const ManageArchivePage = () => {
  const { isDark, colors } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab lives in the URL (?tab=Characters) so a refresh restores the
  // tab you were on instead of snapping back to Persons. Falls back to
  // Persons for a missing or unrecognised value.
  const tabParam = searchParams.get("tab") as Tab | null;
  const activeTab: Tab =
    tabParam && TABS.includes(tabParam) ? tabParam : "Persons";
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Tabs that have successfully loaded at least once. Used so we only show
  // skeletons on a tab's FIRST load — afterwards the existing data stays on
  // screen while it refreshes in the background (no flicker on tab switches).
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());

  // Tabs whose data is currently filtered by a search term.
  const [searchedTabs, setSearchedTabs] = useState<Set<Tab>>(new Set());

  const [persons, setPersons] = useState<Person[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  const navigate = useNavigate();

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
    [],
  );

  // Fetch a single tab (used for search and after add/edit).
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
      setLoadedTabs((prev) => new Set(prev).add(tab));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all three on mount so every stat count is accurate straight away and
  // switching tabs needs no fetch at all (instant, no flicker).
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [pRes, prRes, cRes] = await Promise.all([
        api.get("/api/persons"),
        api.get("/api/productions"),
        api.get("/api/characters"),
      ]);
      if (!pRes.ok || !prRes.ok || !cRes.ok) throw new Error();
      const [p, pr, c] = await Promise.all([
        pRes.json(),
        prRes.json(),
        cRes.json(),
      ]);
      setPersons(p);
      setProductions(pr);
      setCharacters(c);
      setLoadedTabs(new Set<Tab>(["Persons", "Productions", "Characters"]));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData(activeTab, search);
    setSearchedTabs((prev) => {
      const next = new Set(prev);
      if (search.trim()) next.add(activeTab);
      else next.delete(activeTab);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleTabChange = (tab: Tab) => {
    /* Persons is the default, so keep its URL clean (no ?tab=).
       replace: true so switching tabs does not fill the history stack. Back
       should leave this page, not walk back through every tab you clicked. */
    setSearchParams(tab === "Persons" ? {} : { tab }, { replace: true });
    setSearch("");
    setPage(1);
    // If this tab's data is still filtered by an earlier search, restore the
    // full list. Otherwise the data is already loaded — no fetch needed.
    if (searchedTabs.has(tab)) {
      fetchData(tab, "");
      setSearchedTabs((prev) => {
        const next = new Set(prev);
        next.delete(tab);
        return next;
      });
    }
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

  const tabs = TABS;

  // Only show skeletons when this tab has never loaded. Any later fetch keeps
  // the current content visible while new data arrives.
  const showSkeletons = isLoading && !loadedTabs.has(activeTab);

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

  // Clickable name cell — the whole row's entry point to its detail page.
  const NameLink = ({ id, label }: { id: number; label: string }) => (
    <span
      role="link"
      tabIndex={0}
      onClick={() => handleView(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleView(id);
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
      style={{
        flex: 2,
        fontSize: "13px",
        fontWeight: 500,
        // Link uses primary ink, not red — hover underline signals it.
        color: textPrimary,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </span>
  );

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
          <NameLink id={p.id} label={`${p.lastName}, ${p.firstName}`} />
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
          <NameLink id={p.id} label={p.title} />
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.season}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.eventType}
          </span>
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {p.venue}
          </span>
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
          <NameLink id={c.id} label={c.name} />
          <span style={{ flex: 1, fontSize: "13px", color: textSecondary }}>
            {c.opera ?? "—"}
          </span>
        </div>
      ));
    }
  };

  const tableHeaders = {
    Persons: ["Name", "Voice Type", "Contributor Type", "Status"],
    Productions: ["Title", "Season", "Event Type", "Venue"],
    Characters: ["Name", "Opera"],
  };

  // Skeleton rows mirror the real row layout: same flex weights per column
  // (first data column flex: 2, the rest flex: 1) and the same right-aligned
  // 100px actions container, so nothing shifts when data loads in.
  const renderSkeletonRows = () =>
    [0, 1, 2].map((row) => (
      <div
        key={row}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: row < 2 ? `1px solid ${borderLight}` : "none",
        }}
      >
        {tableHeaders[activeTab].map((h, i) =>
          h === "" ? (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "6px",
                minWidth: "100px",
                justifyContent: "flex-end",
              }}
            >
              <LoadingSkeleton width="40px" height="26px" borderRadius="4px" />
              <LoadingSkeleton width="40px" height="26px" borderRadius="4px" />
            </div>
          ) : (
            <span
              key={i}
              style={{
                flex: i === 0 ? 2 : 1,
                paddingRight: "16px",
                boxSizing: "border-box",
              }}
            >
              <LoadingSkeleton
                width={i === 0 ? "70%" : "55%"}
                height="13px"
              />
            </span>
          ),
        )}
      </div>
    ));

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
                {isLoading && !loadedTabs.has(tab) ? (
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
                padding: "8px 16px",
                cursor: "pointer",
                // Active tab text is ink, not red; the red underline bar is
                // the accent that marks the active tab.
                color: activeTab === tab ? textPrimary : textSecondary,
                fontWeight: activeTab === tab ? 600 : 500,
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

        {/* Toolbar — Search is the primary (red) action anchored to the
            input; Add New is de-emphasised and separated to the right so it
            isn't mistaken for the search action right after typing. */}
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
          {/* Primary: belongs to the input, so it's the emphasised action. */}
          <button
            onClick={handleSearch}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              padding: "8px 18px",
              borderRadius: "6px",
              cursor: "pointer",
              border: "1px solid #9B1C1C",
              background: "#9B1C1C",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Search
          </button>

          {/* Divider separates the search cluster from the create action. */}
          <div
            style={{
              width: "1px",
              height: "24px",
              background: border,
              margin: "0 4px",
            }}
          />

          {/* Secondary: a create action, deliberately not competing with
              Search for the eye immediately after typing. */}
          <button
            onClick={handleAddNew}
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
              whiteSpace: "nowrap",
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
              {!showSkeletons &&
                `${activeList.length} ${activeTab.toLowerCase()}`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: textMuted }}>Show</span>
              <Dropdown
                size="xs"
                allowClear={false}
                highlightWhenSet={false}
                ariaLabel="Results per page"
                value={String(pageSize)}
                options={pageSizeOptions}
                onChange={(v) => setPageSize(Number(v))}
              />
              <span style={{ fontSize: "12px", color: textMuted }}>
                per page
              </span>
            </div>
          </div>
        )}

        {/* Table */}
        {hasError ? (
          <ErrorState onRetry={() => fetchAll()} />
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

              {showSkeletons ? (
                renderSkeletonRows()
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
            {!showSkeletons && totalPages > 1 && (
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