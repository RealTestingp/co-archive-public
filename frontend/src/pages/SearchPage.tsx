/* SearchPage.tsx
   The main entry point of the app, and the start of the demo path.

   One search box queries three things at once: productions, people and
   characters. Results are split across three tabs so the user can see how many
   matches each category has without running three separate searches.

   The design decision worth knowing: the query lives in the URL, not in state.
   Typing updates a local input, but pressing Enter writes ?q= into the address
   bar, and a separate effect reacts to that and fetches. So the URL is the
   source of truth for what is being searched.

   That costs an extra hop, and the payoff is:
   - A search is shareable. Send someone the URL and they see your results.
   - Back and forward move through searches, which is what users expect.
   - A refresh keeps the search rather than emptying the page.

   Filtering and pagination happen in the browser after the fetch, not on the
   server. Fine at the archive's current size, and the honest limitation is that
   it does not scale: every match is fetched before any of it is filtered.
*/
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Dropdown from "../components/dropdown/Dropdown";
import { useTheme } from "../context/ThemeContext";
import styles from "./SearchPage.module.css";
import { api } from "../api";

type Tab = "Productions" | "Persons" | "Characters";

interface PersonResult {
  id: number;
  firstName: string;
  lastName: string;
  nationality?: string;
  voiceType?: string;
}

interface ProductionResult {
  id: number;
  title: string;
  season?: string;
  eventType?: string;
  venue?: string;
  language?: string;
}

interface CharacterResult {
  id: number;
  name: string;
  operaTitle?: string;
  appearanceCount?: number;
}

interface Results {
  persons: PersonResult[];
  productions: ProductionResult[];
  characters: CharacterResult[];
}

interface LookupItem {
  id: number;
  name?: string;
  label?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { colors } = useTheme();

  const urlQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<Tab>("Productions");
  const [results, setResults] = useState<Results | null>(null);
  // Which query the current `results` actually belong to. Without this there's
  // a render where loading is still false but results are from the PREVIOUS
  // query, which flashes "no results" for a frame.
  const [resultsQuery, setResultsQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Filter state
  const [voiceTypes, setVoiceTypes] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [seasons, setSeasons] = useState<LookupItem[]>([]);

  const [selectedVoiceType, setSelectedVoiceType] = useState("");
  const [selectedNationality, setSelectedNationality] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");

  const hasSearched = urlQuery.trim().length > 0;
  // Backend returns [] for queries under 2 chars, so a single character would
  // otherwise read as "no results". Flag it and show a hint instead.
  const MIN_SEARCH = 2;
  const tooShort = hasSearched && urlQuery.trim().length < MIN_SEARCH;

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [vtRes, natRes, langRes, seasonRes] = await Promise.all([
          api.get(`/api/voicetypes`),
          api.get(`/api/nationalities`),
          api.get(`/api/languages`),
          api.get(`/api/seasons`),
        ]);
        if (vtRes.ok) setVoiceTypes(await vtRes.json());
        if (natRes.ok) setNationalities(await natRes.json());
        if (langRes.ok) setLanguages(await langRes.json());
        if (seasonRes.ok) setSeasons(await seasonRes.json());
      } catch {
        // silently fail
      }
    };
    fetchLookups();
  }, []);

  /* The URL drives the search, not the input box.

     handleSearch writes ?q= into the address bar, and this effect reacts to it.
     That indirection is what makes the back button, refresh and shared links all
     work, since every one of them changes the URL and lands here.

     Syncing inputValue from urlQuery on the way in keeps the box showing the
     search that actually ran, including after a back navigation. */
  useEffect(() => {
    setInputValue(urlQuery);
    const q = urlQuery.trim();
    // Only hit the API at 2+ chars — under that the backend just returns [],
    // and we show a "type more" hint instead.
    if (q.length >= MIN_SEARCH) {
      fetchResults(q);
    } else {
      setResults(null);
      setResultsQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  /* Switching tabs clears the filters as well as the page. The three tabs have
     different filters, so a nationality left set from the Persons tab would keep
     filtering invisibly after moving to Productions, and the user would see a
     short list with no way to see why. */
  useEffect(() => {
    setPage(1);
    setSelectedVoiceType("");
    setSelectedNationality("");
    setSelectedLanguage("");
    setSelectedSeason("");
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedVoiceType,
    selectedNationality,
    selectedLanguage,
    selectedSeason,
    pageSize,
  ]);

  /* Searches all three record types in parallel.

     Promise.all is right here, unlike the report filters, because all three
     results are shown together as tab counts. A partial answer would show a
     wrong count on one tab, which is worse than an error message.

     The second Promise.all is a separate step because reading a response body
     is itself asynchronous. Each res.ok check happens there, so an endpoint
     returning an error contributes an empty array rather than throwing and
     taking the other two down with it.

     No cancellation here. A slow response for an old query can still land after
     a newer one. resultsQuery above is what stops that showing as a wrong
     "no results" flash, but the cleaner fix is an AbortController. */
  const fetchResults = async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const [personsRes, productionsRes, charactersRes] = await Promise.all([
        api.get(`/api/persons?search=${encodeURIComponent(q)}`),
        api.get(`/api/productions?search=${encodeURIComponent(q)}`),
        api.get(`/api/characters?search=${encodeURIComponent(q)}`),
      ]);

      const [persons, productions, characters] = await Promise.all([
        personsRes.ok ? personsRes.json() : [],
        productionsRes.ok ? productionsRes.json() : [],
        charactersRes.ok ? charactersRes.json() : [],
      ]);

      setResults({ persons, productions, characters });
      setResultsQuery(q);
      setPage(1);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearAll = () => {
    setInputValue("");
    setSearchParams({});
    setResults(null);
    setResultsQuery("");
    setActiveTab("Productions");
    clearFilters();
  };

  // ── Dropdown option lists ──
  const voiceTypeOptions = useMemo(
    () =>
      voiceTypes
        .filter((v) => v.name)
        .map((v) => ({ value: v.name!, label: v.name! })),
    [voiceTypes]
  );

  const nationalityOptions = useMemo(
    () =>
      nationalities
        .filter((n) => n.name)
        .map((n) => ({ value: n.name!, label: n.name! })),
    [nationalities]
  );

  const languageOptions = useMemo(
    () =>
      languages
        .filter((l) => l.name)
        .map((l) => ({ value: l.name!, label: l.name! })),
    [languages]
  );

  const seasonOptions = useMemo(
    () =>
      seasons
        .filter((s) => s.label)
        .map((s) => ({ value: s.label!, label: s.label! })),
    [seasons]
  );

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
    []
  );

  // Client-side filtering
  const filteredPersons =
    results?.persons.filter((p) => {
      if (selectedVoiceType && p.voiceType !== selectedVoiceType) return false;
      if (selectedNationality && p.nationality !== selectedNationality)
        return false;
      return true;
    }) ?? [];

  const filteredProductions =
    results?.productions.filter((p) => {
      if (selectedSeason && p.season !== selectedSeason) return false;
      if (selectedLanguage && p.language !== selectedLanguage) return false;
      return true;
    }) ?? [];

  const filteredCharacters = results?.characters ?? [];

  const tabs: Tab[] = ["Productions", "Persons", "Characters"];

  const tabCount = (tab: Tab) => {
    if (!results) return 0;
    if (tab === "Productions") return results.productions.length;
    if (tab === "Persons") return results.persons.length;
    if (tab === "Characters") return results.characters.length;
    return 0;
  };

  const showPersons = activeTab === "Persons";
  const showProductions = activeTab === "Productions";
  const showCharacters = activeTab === "Characters";

  const hasActiveFilters =
    selectedVoiceType ||
    selectedNationality ||
    selectedLanguage ||
    selectedSeason;

  const clearFilters = () => {
    setSelectedVoiceType("");
    setSelectedNationality("");
    setSelectedLanguage("");
    setSelectedSeason("");
  };

  // Pagination
  const paginate = <T,>(arr: T[]): T[] => {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  };

  const activeSingleList =
    activeTab === "Persons"
      ? filteredPersons
      : activeTab === "Productions"
        ? filteredProductions
        : filteredCharacters;

  const totalPages = Math.ceil(activeSingleList.length / pageSize) || 1;

  const pagedPersons = paginate(filteredPersons);
  const pagedProductions = paginate(filteredProductions);
  const pagedCharacters = paginate(filteredCharacters);

  // Show skeletons while fetching AND while results still belong to an older
  // query — that's what stops the "no results" flash mid-search.
  const isStale = hasSearched && resultsQuery !== urlQuery.trim();
  // Never skeleton for a too-short query — we don't fetch, so the stale check
  // would otherwise flash the loading bars above the "Keep typing…" hint.
  const showSkeletons = (loading || isStale) && !tooShort;

  return (
    <div
      className={styles.page}
      style={{ background: colors.background, color: colors.textPrimary }}
    >
      <NavBar />

      {/* ── Hero ── */}
      {!hasSearched && (
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Calgary Opera Archive</div>
          <h1 className={styles.heading}>Explore the Archive</h1>
          <p className={styles.subheading}>
            Search productions, persons, and characters spanning decades of
            performance.
          </p>
          <div className={styles.heroTabs}>
            {(["Productions", "Persons", "Characters"] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.heroTab} ${activeTab === tab ? styles.heroTabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.heroSearchBar}>
            <input
              type="text"
              className={styles.heroInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${activeTab.toLowerCase()} by title, name, or keyword…`}
            />
            <button className={styles.heroBtn} onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      )}

      {/* ── Compact search bar ── */}
      {hasSearched && (
        <div className={styles.compactBar}>
          <div className={styles.compactInner}>
            <div className={styles.compactInputWrap}>
              <svg
                className={styles.compactIcon}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.compactInput}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
                aria-label="Refine search"
              />
            </div>
            <button className={styles.compactBtn} onClick={handleSearch}>
              Search
            </button>
            <button className={styles.clearAllBtn} onClick={handleClearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {hasSearched && (
        <div className={styles.results}>
          {results && !showSkeletons && (
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                {activeSingleList.length} result
                {activeSingleList.length !== 1 ? "s" : ""} for "{urlQuery}"
              </span>
              {/* Per-page dropdown */}
              <div className={styles.perPageWrap}>
                <span className={styles.perPageLabel}>Show</span>
                <Dropdown
                  size="xs"
                  allowClear={false}
                  highlightWhenSet={false}
                  ariaLabel="Results per page"
                  value={String(pageSize)}
                  options={pageSizeOptions}
                  onChange={(v) => setPageSize(Number(v))}
                />
                <span className={styles.perPageLabel}>per page</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {results && !showSkeletons && (
                  <span
                    className={`${styles.tabCount} ${activeTab === tab ? styles.tabCountActive : ""}`}
                  >
                    {tabCount(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters */}
          {hasSearched && !showSkeletons && !tooShort && (
            <div className={styles.filterRow}>
              {activeTab === "Persons" && (
                <>
                  <Dropdown
                    placeholder="Voice Type"
                    value={selectedVoiceType}
                    options={voiceTypeOptions}
                    onChange={setSelectedVoiceType}
                  />
                  <Dropdown
                    placeholder="Nationality"
                    value={selectedNationality}
                    options={nationalityOptions}
                    onChange={setSelectedNationality}
                  />
                </>
              )}
              {activeTab === "Productions" && (
                <>
                  <Dropdown
                    placeholder="Language"
                    value={selectedLanguage}
                    options={languageOptions}
                    onChange={setSelectedLanguage}
                  />
                  <Dropdown
                    placeholder="Season"
                    value={selectedSeason}
                    options={seasonOptions}
                    onChange={setSelectedSeason}
                  />
                </>
              )}
              {hasActiveFilters && (
                <button className={styles.filterClear} onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {showSkeletons && (
            <div className={styles.skeletons}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !showSkeletons && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>{error}</p>
            </div>
          )}

          {/* Search term too short — hint instead of a "no results" flash. */}
          {tooShort && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Keep typing…</p>
              <p className={styles.emptyText}>
                Please enter at least 2 characters to search.
              </p>
            </div>
          )}

          {/* Empty */}
          {!showSkeletons &&
            !error &&
            !tooShort &&
            results &&
            activeSingleList.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No results for "{urlQuery}"</p>
                <p className={styles.emptyText}>
                  Try a different spelling or adjust your filters.
                </p>
              </div>
            )}

          {/* Result groups */}
          {!showSkeletons &&
            !error &&
            results &&
            activeSingleList.length > 0 && (
              <div className={styles.resultGroups}>
                {showPersons && pagedPersons.length > 0 && (
                  <div className={styles.group}>
                    <div className={styles.groupLabel}>People</div>
                    {pagedPersons.map((p) => (
                      <Link
                        key={p.id}
                        to={`/persons/${p.id}`}
                        className={styles.resultCard}
                      >
                        <div className={styles.avatar}>
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardName}>
                            {p.firstName} {p.lastName}
                          </div>
                          {(p.voiceType || p.nationality) && (
                            <div className={styles.cardMeta}>
                              {[p.voiceType, p.nationality]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {showProductions && pagedProductions.length > 0 && (
                  <div className={styles.group}>
                    <div className={styles.groupLabel}>Productions</div>
                    {pagedProductions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/productions/${p.id}`}
                        className={styles.resultCard}
                      >
                        <div
                          className={`${styles.avatar} ${styles.avatarProd}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M2 4h20" />
                            <path d="M5 4v16c3 0 4-2.5 4-6V4" />
                            <path d="M19 4v16c-3 0-4-2.5-4-6V4" />
                          </svg>
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardName}>{p.title}</div>
                          {(p.season || p.venue) && (
                            <div className={styles.cardMeta}>
                              {[p.season, p.venue].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {showCharacters && pagedCharacters.length > 0 && (
                  <div className={styles.group}>
                    <div className={styles.groupLabel}>Characters</div>
                    {pagedCharacters.map((c) => (
                      <Link
                        key={c.id}
                        to={`/characters/${c.id}`}
                        className={styles.resultCard}
                      >
                        <div
                          className={`${styles.avatar} ${styles.avatarChar}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                          </svg>
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardName}>{c.name}</div>
                          {c.operaTitle && (
                            <div className={styles.cardMeta}>
                              {c.operaTitle}
                              {c.appearanceCount
                                ? ` · ${c.appearanceCount} appearance${c.appearanceCount !== 1 ? "s" : ""} in archive`
                                : ""}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* Pagination */}
          {!showSkeletons && !error && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;