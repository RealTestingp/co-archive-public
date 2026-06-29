import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { useTheme } from '../context/ThemeContext';
import styles from './SearchPage.module.css';

type Tab = 'Productions' | 'Persons' | 'Characters';

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

  const urlQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<Tab>('Productions');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Filter state
  const [voiceTypes, setVoiceTypes] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [seasons, setSeasons] = useState<LookupItem[]>([]);

  const [selectedVoiceType, setSelectedVoiceType] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');

  const hasSearched = urlQuery.trim().length > 0;

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [vtRes, natRes, langRes, seasonRes] = await Promise.all([
          fetch(`/api/voicetypes`),
          fetch(`/api/nationalities`),
          fetch(`/api/languages`),
          fetch(`/api/seasons`),
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

  useEffect(() => {
    setInputValue(urlQuery);
    if (urlQuery.trim()) {
      fetchResults(urlQuery.trim());
    } else {
      setResults(null);
    }
  }, [urlQuery]);

  // Reset page when tab or filters change
  useEffect(() => {
    setPage(1);
    setSelectedVoiceType('');
    setSelectedNationality('');
    setSelectedLanguage('');
    setSelectedSeason('');
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [selectedVoiceType, selectedNationality, selectedLanguage, selectedSeason, pageSize]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const [personsRes, productionsRes, charactersRes] = await Promise.all([
        fetch(`/api/persons?search=${encodeURIComponent(q)}`),
        fetch(`/api/productions?search=${encodeURIComponent(q)}`),
        // Fixed: characters uses ?search= not ?name=
        fetch(`/api/characters?search=${encodeURIComponent(q)}`),
      ]);

      const [persons, productions, characters] = await Promise.all([
        personsRes.ok ? personsRes.json() : [],
        productionsRes.ok ? productionsRes.json() : [],
        charactersRes.ok ? charactersRes.json() : [],
      ]);

      setResults({ persons, productions, characters });
      setPage(1);
    } catch {
      setError('Something went wrong. Please try again.');
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
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearAll = () => {
    setInputValue('');
    setSearchParams({});
    setResults(null);
    setActiveTab('Productions');
    clearFilters();
  };

  // Client-side filtering
  const filteredPersons = results?.persons.filter((p) => {
    if (selectedVoiceType && p.voiceType !== selectedVoiceType) return false;
    if (selectedNationality && p.nationality !== selectedNationality) return false;
    return true;
  }) ?? [];

  const filteredProductions = results?.productions.filter((p) => {
    if (selectedSeason && p.season !== selectedSeason) return false;
    return true;
  }) ?? [];

  const filteredCharacters = results?.characters ?? [];

  const tabs: Tab[] = ['Productions', 'Persons', 'Characters'];

  const tabCount = (tab: Tab) => {
    if (!results) return 0;
    if (tab === 'Productions') return results.productions.length;
    if (tab === 'Persons') return results.persons.length;
    if (tab === 'Characters') return results.characters.length;
    return 0;
  };

  const showPersons = activeTab === 'Persons';
  const showProductions = activeTab === 'Productions';
  const showCharacters = activeTab === 'Characters';

  const hasActiveFilters = selectedVoiceType || selectedNationality || selectedLanguage || selectedSeason;

  const clearFilters = () => {
    setSelectedVoiceType('');
    setSelectedNationality('');
    setSelectedLanguage('');
    setSelectedSeason('');
  };

  // Pagination
  const paginate = <T,>(arr: T[]): T[] => {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  };

  const activeSingleList =
    activeTab === 'Persons' ? filteredPersons :
    activeTab === 'Productions' ? filteredProductions :
    filteredCharacters;

  const totalPages = Math.ceil(activeSingleList.length / pageSize) || 1;

  const pagedPersons = paginate(filteredPersons);
  const pagedProductions = paginate(filteredProductions);
  const pagedCharacters = paginate(filteredCharacters);

  return (
    <div className={styles.page} style={{ background: colors.background, color: colors.textPrimary }}>
      <NavBar />

      {/* ── Hero ── */}
      {!hasSearched && (
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Calgary Opera Archive</div>
          <h1 className={styles.heading}>Explore the Archive</h1>
          <p className={styles.subheading}>
            Search productions, persons, and characters spanning decades of performance.
          </p>
          <div className={styles.heroTabs}>
            {(['Productions', 'Persons', 'Characters'] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.heroTab} ${activeTab === tab ? styles.heroTabActive : ''}`}
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
            <button className={styles.heroBtn} onClick={handleSearch}>Search</button>
          </div>
        </div>
      )}

      {/* ── Compact search bar ── */}
      {hasSearched && (
        <div className={styles.compactBar}>
          <div className={styles.compactInner}>
            <div className={styles.compactInputWrap}>
              <svg className={styles.compactIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <button className={styles.compactBtn} onClick={handleSearch}>Search</button>
            <button className={styles.clearAllBtn} onClick={handleClearAll}>Clear all</button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {hasSearched && (
        <div className={styles.results}>

          {results && !loading && (
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                {activeSingleList.length} result{activeSingleList.length !== 1 ? 's' : ''} for "{urlQuery}"
              </span>
              {/* Per-page dropdown */}
              <div className={styles.perPageWrap}>
                <span className={styles.perPageLabel}>Show</span>
                <select
                  className={styles.perPageSelect}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className={styles.perPageLabel}>per page</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {results && (
                  <span className={`${styles.tabCount} ${activeTab === tab ? styles.tabCountActive : ''}`}>
                    {tabCount(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters */}
          {hasSearched && !loading && (
            <div className={styles.filterRow}>
              {activeTab === 'Persons' && (
                <>
                  <select
                    className={`${styles.filterSelect} ${selectedVoiceType ? styles.filterSelectActive : ''}`}
                    value={selectedVoiceType}
                    onChange={(e) => setSelectedVoiceType(e.target.value)}
                  >
                    <option value="">Voice Type</option>
                    {voiceTypes.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                  <select
                    className={`${styles.filterSelect} ${selectedNationality ? styles.filterSelectActive : ''}`}
                    value={selectedNationality}
                    onChange={(e) => setSelectedNationality(e.target.value)}
                  >
                    <option value="">Nationality</option>
                    {nationalities.map((n) => (
                      <option key={n.id} value={n.name}>{n.name}</option>
                    ))}
                  </select>
                </>
              )}
              {activeTab === 'Productions' && (
                <>
                  <select
                    className={`${styles.filterSelect} ${selectedLanguage ? styles.filterSelectActive : ''}`}
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="">Language</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  <select
                    className={`${styles.filterSelect} ${selectedSeason ? styles.filterSelectActive : ''}`}
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                  >
                    <option value="">Season</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </select>
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
          {loading && (
            <div className={styles.skeletons}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && results && activeSingleList.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No results for "{urlQuery}"</p>
              <p className={styles.emptyText}>Try a different spelling or adjust your filters.</p>
            </div>
          )}

          {/* Result groups */}
          {!loading && !error && results && activeSingleList.length > 0 && (
            <div className={styles.resultGroups}>

              {showPersons && pagedPersons.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>People</div>
                  {pagedPersons.map((p) => (
                    <Link key={p.id} to={`/persons/${p.id}`} className={styles.resultCard}>
                      <div className={styles.avatar}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{p.firstName} {p.lastName}</div>
                        {(p.voiceType || p.nationality) && (
                          <div className={styles.cardMeta}>
                            {[p.voiceType, p.nationality].filter(Boolean).join(' · ')}
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
                    <Link key={p.id} to={`/productions/${p.id}`} className={styles.resultCard}>
                      <div className={`${styles.avatar} ${styles.avatarProd}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2 6l10-4 10 4v2H2V6z" /><path d="M4 8v10h16V8" /><path d="M9 12h6" />
                        </svg>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{p.title}</div>
                        {(p.season || p.venue) && (
                          <div className={styles.cardMeta}>
                            {[p.season, p.venue].filter(Boolean).join(' · ')}
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
                    <Link key={c.id} to={`/characters/${c.id}`} className={styles.resultCard}>
                      <div className={`${styles.avatar} ${styles.avatarChar}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{c.name}</div>
                        {c.operaTitle && (
                          <div className={styles.cardMeta}>
                            {c.operaTitle}{c.appearanceCount ? ` · ${c.appearanceCount} appearance${c.appearanceCount !== 1 ? 's' : ''} in archive` : ''}
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
          {!loading && !error && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
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