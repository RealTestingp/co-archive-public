/* ManageArchivePage.tsx
   The admin hub. Four tabs over the four record types, with search,
   pagination, and the entry point to every add modal.

   Admin only. The route is wrapped in AdminRoute inside ProtectedRoute in
   App.tsx, so a non admin is redirected to search before this ever renders.
   Worth repeating that this is a UI guard, not a security boundary.

   Two loading strategies, used deliberately:
   - fetchAll runs once on mount and loads all tabs together, so the tab
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

   Per-tab configuration (endpoint, headers, empty message, detail route) lives
   in the lookup maps below rather than in ternary chains. At three tabs the
   chains were readable; at four they stopped being, and the maps mean adding a
   fifth tab is a handful of new entries rather than an edit to every chain.

   Operas is the odd tab out in two ways, both deliberate:
   - There is no opera detail page, so its title is plain text rather than a
     NameLink. Nothing to navigate to.
   - It is the only tab with row-level Edit and Delete actions. The others are
     managed from their detail pages, which operas don't have. This tab is the
     only place an opera can be corrected or removed, which is the whole reason
     it exists — before it, operas could only be created as a side effect of
     adding a production and could never be fixed afterwards.
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
import AddOperaModal from "../components/modals/AddOperaModal";
import EditOperaModal from "../components/modals/EditOperaModal";
import type { OperaForEdit } from "../components/modals/EditOperaModal";
import DeleteOperaModal from "../components/modals/DeleteOperaModal";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

type Tab = "Persons" | "Productions" | "Characters" | "Operas";

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

interface Opera {
  id: number;
  title: string;
  // GET /api/operas projects these alongside the title so this tab can list
  // them and EditOperaModal can pre-fill without a second request.
  composers: { id: number; name: string }[];
  librettists: { id: number; name: string }[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const TABS: Tab[] = ["Persons", "Productions", "Characters", "Operas"];

// Per-tab API endpoint. Every one of these supports ?search=.
const ENDPOINTS: Record<Tab, string> = {
  Persons: "/api/persons",
  Productions: "/api/productions",
  Characters: "/api/characters",
  Operas: "/api/operas",
};

// Detail page route prefix. Operas is absent — it has no detail page, which is
// what makes its rows render as plain text instead of links.
const DETAIL_ROUTES: Partial<Record<Tab, string>> = {
  Persons: "/persons",
  Productions: "/productions",
  Characters: "/characters",
};

// An empty string header is the actions column: right-aligned, fixed width,
// rendered as "Actions". Only Operas has one.
const TABLE_HEADERS: Record<Tab, string[]> = {
  Persons: ["Name", "Voice Type", "Contributor Type", "Status"],
  Productions: ["Title", "Season", "Event Type", "Venue"],
  Characters: ["Name", "Opera"],
  Operas: ["Title", "Composer(s)", "Librettist(s)", ""],
};

const EMPTY_MESSAGES: Record<Tab, string> = {
  Persons: "No persons found.",
  Productions: "No productions found.",
  Characters: "No characters found.",
  Operas: "No operas found.",
};

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
  const [isOperaModalOpen, setIsOperaModalOpen] = useState(false);
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
  const [operas, setOperas] = useState<Opera[]>([]);

  // Opera row actions. Null means no modal open; the opera itself is held so
  // the modals can pre-fill and so the delete confirmation can name it.
  const [operaToEdit, setOperaToEdit] = useState<OperaForEdit | null>(null);
  const [operaToDelete, setOperaToDelete] = useState<Opera | null>(null);
  const [isDeletingOpera, setIsDeletingOpera] = useState(false);
  const [deleteOperaError, setDeleteOperaError] = useState<string | null>(null);

  const navigate = useNavigate();

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
    [],
  );

  // Where each tab's fetched rows go. Declared as a map so fetchData doesn't
  // need a branch per tab.
  const setters = useMemo(
    () =>
      ({
        Persons: setPersons,
        Productions: setProductions,
        Characters: setCharacters,
        Operas: setOperas,
        // Each setter takes its own row type; the map erases that, so callers
        // hand over parsed JSON and the interfaces above document the shape.
      }) as Record<Tab, (rows: never[]) => void>,
    [],
  );

  // Fetch a single tab (used for search and after add/edit/delete).
  const fetchData = useCallback(
    async (tab: Tab, searchTerm = "") => {
      setIsLoading(true);
      setHasError(false);
      try {
        const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
        const res = await api.get(`${ENDPOINTS[tab]}${q}`);
        if (!res.ok) throw new Error();
        setters[tab](await res.json());
        setLoadedTabs((prev) => new Set(prev).add(tab));
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [setters],
  );

  // Load every tab on mount so all stat counts are accurate straight away and
  // switching tabs needs no fetch at all (instant, no flicker).
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const responses = await Promise.all(
        TABS.map((tab) => api.get(ENDPOINTS[tab])),
      );
      if (responses.some((r) => !r.ok)) throw new Error();
      const payloads = await Promise.all(responses.map((r) => r.json()));
      TABS.forEach((tab, i) => setters[tab](payloads[i]));
      setLoadedTabs(new Set<Tab>(TABS));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [setters]);

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
    if (activeTab === "Operas") setIsOperaModalOpen(true);
  };

  const handleView = (id: number) => {
    const route = DETAIL_ROUTES[activeTab];
    if (route) navigate(`${route}/${id}`);
  };

  /* Delete leans entirely on the backend's 409. OperasController blocks the
     delete when productions reference the opera, and the DbUpdateException
     catch covers characters (Character → Opera is DeleteBehavior.Restrict).
     The message it sends is a bare string rather than a JSON object, so read
     it as text and strip the surrounding quotes rather than looking for
     `.message` — that's what the person/production delete handlers do, and it
     is why their 409s show the generic fallback instead of the real reason. */
  const handleDeleteOperaConfirm = async () => {
    if (!operaToDelete) return;
    setIsDeletingOpera(true);
    setDeleteOperaError(null);
    try {
      const res = await api.delete(`/api/operas/${operaToDelete.id}`);
      if (!res.ok) {
        const message = (await res.text().catch(() => "")).replace(/^"|"$/g, "");
        throw new Error(
          message || "Failed to delete this opera. Please try again.",
        );
      }
      setOperaToDelete(null);
      fetchData("Operas", searchedTabs.has("Operas") ? search : "");
    } catch (err) {
      setDeleteOperaError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to delete this opera. Please try again.",
      );
    } finally {
      setIsDeletingOpera(false);
    }
  };

  const tabs = TABS;

  // Only show skeletons when this tab has never loaded. Any later fetch keeps
  // the current content visible while new data arrives.
  const showSkeletons = isLoading && !loadedTabs.has(activeTab);

  // Active list for pagination.
  const listsByTab: Record<Tab, { id: number }[]> = useMemo(
    () => ({
      Persons: persons,
      Productions: productions,
      Characters: characters,
      Operas: operas,
    }),
    [persons, productions, characters, operas],
  );

  const activeList = listsByTab[activeTab];
  const totalPages = Math.ceil(activeList.length / pageSize);
  const pagedList = activeList.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    Persons: persons.length,
    Productions: productions.length,
    Characters: characters.length,
    Operas: operas.length,
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

  // Row-level action button. Neutral by default; Delete turns red on hover so
  // the destructive one is only loud at the moment it's about to be used.
  const RowAction = ({
    label,
    onClick,
    danger = false,
  }: {
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? "#9B1C1C" : textSecondary;
        e.currentTarget.style.color = danger ? "#9B1C1C" : textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.color = textSecondary;
      }}
      style={{
        fontSize: "11px",
        fontWeight: 500,
        padding: "4px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        border: `1px solid ${border}`,
        background: surface,
        color: textSecondary,
        fontFamily: "Inter, sans-serif",
        transition: "border-color 0.15s ease, color 0.15s ease",
      }}
    >
      {label}
    </button>
  );

  const rowStyle = (i: number): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom:
      i < pagedList.length - 1 ? `1px solid ${borderLight}` : "none",
  });

  const cellStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "13px",
    color: textSecondary,
  };

  const renderRows = () => {
    if (activeTab === "Persons") {
      return (pagedList as Person[]).map((p, i) => (
        <div key={p.id} style={rowStyle(i)}>
          <NameLink id={p.id} label={`${p.lastName}, ${p.firstName}`} />
          <span style={cellStyle}>{p.voiceType ?? "—"}</span>
          <span style={cellStyle}>{p.contributorTypes.join(", ") || "—"}</span>
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
        <div key={p.id} style={rowStyle(i)}>
          <NameLink id={p.id} label={p.title} />
          <span style={cellStyle}>{p.season}</span>
          <span style={cellStyle}>{p.eventType}</span>
          <span style={cellStyle}>{p.venue}</span>
        </div>
      ));
    }

    if (activeTab === "Characters") {
      return (pagedList as Character[]).map((c, i) => (
        <div key={c.id} style={rowStyle(i)}>
          <NameLink id={c.id} label={c.name} />
          <span style={cellStyle}>{c.opera ?? "—"}</span>
        </div>
      ));
    }

    if (activeTab === "Operas") {
      return (pagedList as Opera[]).map((o, i) => (
        <div key={o.id} style={rowStyle(i)}>
          {/* Plain text, not a NameLink — there is no opera detail page. */}
          <span
            style={{
              flex: 2,
              fontSize: "13px",
              fontWeight: 500,
              color: textPrimary,
            }}
          >
            {o.title}
          </span>
          <span style={cellStyle}>
            {o.composers?.map((c) => c.name).join(", ") || "—"}
          </span>
          <span style={cellStyle}>
            {o.librettists?.map((l) => l.name).join(", ") || "—"}
          </span>
          <div
            style={{
              display: "flex",
              gap: "6px",
              minWidth: "100px",
              justifyContent: "flex-end",
            }}
          >
            <RowAction
              label="Edit"
              onClick={() =>
                setOperaToEdit({
                  id: o.id,
                  title: o.title,
                  composers: o.composers ?? [],
                  librettists: o.librettists ?? [],
                })
              }
            />
            <RowAction
              label="Delete"
              danger
              onClick={() => {
                setDeleteOperaError(null);
                setOperaToDelete(o);
              }}
            />
          </div>
        </div>
      ));
    }
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
        {TABLE_HEADERS[activeTab].map((h, i) =>
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
                {TABLE_HEADERS[activeTab].map((h, i) => (
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
                  {EMPTY_MESSAGES[activeTab]}
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
      <AddOperaModal
        isOpen={isOperaModalOpen}
        onClose={() => setIsOperaModalOpen(false)}
        onSuccess={() => fetchData("Operas", search)}
      />

      {/* Edit/Delete are rendered only while an opera is selected, so the
          modals always receive a non-null record and don't need to guard. */}
      {operaToEdit && (
        <EditOperaModal
          isOpen
          opera={operaToEdit}
          onClose={() => setOperaToEdit(null)}
          onSuccess={() =>
            fetchData("Operas", searchedTabs.has("Operas") ? search : "")
          }
        />
      )}
      {operaToDelete && (
        <DeleteOperaModal
          isOpen
          operaTitle={operaToDelete.title}
          isDeleting={isDeletingOpera}
          error={deleteOperaError}
          onCancel={() => {
            setOperaToDelete(null);
            setDeleteOperaError(null);
          }}
          onConfirm={handleDeleteOperaConfirm}
        />
      )}
    </div>
  );
};

export default ManageArchivePage;
