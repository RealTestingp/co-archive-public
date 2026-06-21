import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import styles from './SearchPage.module.css';

type Tab = 'All' | 'Productions' | 'Persons' | 'Characters';

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
  seasonLabel?: string;
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

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasSearched = urlQuery.trim().length > 0;

  useEffect(() => {
    setInputValue(urlQuery);
    if (urlQuery.trim()) {
      fetchResults(urlQuery.trim());
    } else {
      setResults(null);
    }
  }, [urlQuery]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const [personsRes, productionsRes, charactersRes] = await Promise.all([
        fetch(`/api/persons?search=${encodeURIComponent(q)}`),
        fetch(`/api/productions?search=${encodeURIComponent(q)}`),
        fetch(`/api/characters?name=${encodeURIComponent(q)}`),
      ]);

      const [persons, productions, characters] = await Promise.all([
        personsRes.ok ? personsRes.json() : [],
        productionsRes.ok ? productionsRes.json() : [],
        charactersRes.ok ? charactersRes.json() : [],
      ]);

      setResults({ persons, productions, characters });
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

  const totalCount = results
    ? results.persons.length + results.productions.length + results.characters.length
    : 0;

  const tabs: Tab[] = ['All', 'Productions', 'Persons', 'Characters'];

  const tabCount = (tab: Tab) => {
    if (!results) return 0;
    if (tab === 'All') return totalCount;
    if (tab === 'Productions') return results.productions.length;
    if (tab === 'Persons') return results.persons.length;
    if (tab === 'Characters') return results.characters.length;
    return 0;
  };

  const showPersons = activeTab === 'All' || activeTab === 'Persons';
  const showProductions = activeTab === 'All' || activeTab === 'Productions';
  const showCharacters = activeTab === 'All' || activeTab === 'Characters';

  return (
    <div className={styles.page}>
      <NavBar />

      {/* ── Hero (shown when no search yet) ── */}
      {!hasSearched && (
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Calgary Opera Archive</div>
          <h1 className={styles.heading}>Explore the Archive</h1>
          <p className={styles.subheading}>
            Search productions, persons, and characters spanning decades of performance.
          </p>
          <div className={styles.heroTabs}>
            {(['All', 'Productions', 'Persons', 'Characters'] as const).map((tab) => (
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
              placeholder={activeTab === 'All' ? 'Search by title, name, or keyword…' : `Search ${activeTab.toLowerCase()} by title, name, or keyword…`}
            />
            <button className={styles.heroBtn} onClick={handleSearch}>Search</button>
          </div>
        </div>
      )}

      {/* ── Compact search bar (shown after search) ── */}
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
          </div>
        </div>
      )}

      {/* ── Results area ── */}
      {hasSearched && (
        <div className={styles.results}>

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
          {!loading && !error && results && totalCount === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No results for "{urlQuery}"</p>
              <p className={styles.emptyText}>Try a different spelling or a broader search term.</p>
            </div>
          )}

          {/* Result groups */}
          {!loading && !error && results && totalCount > 0 && (
            <div className={styles.resultGroups}>

              {showPersons && results.persons.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>People</div>
                  {results.persons.map((p) => (
                    <Link key={p.id} to={`/persons/${p.id}`} className={styles.resultCard}>
                      <div className={styles.avatar}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{p.firstName} {p.lastName}</div>
                        <div className={styles.cardMeta}>
                          {[p.voiceType, p.nationality].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <span className={styles.cardTag}>Person</span>
                    </Link>
                  ))}
                </div>
              )}

              {showProductions && results.productions.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>Productions</div>
                  {results.productions.map((p) => (
                    <Link key={p.id} to={`/productions/${p.id}`} className={styles.resultCard}>
                      <div className={`${styles.avatar} ${styles.avatarProd}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2 6l10-4 10 4v2H2V6z" /><path d="M4 8v10h16V8" /><path d="M9 12h6" />
                        </svg>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{p.title}</div>
                        <div className={styles.cardMeta}>
                          {[p.seasonLabel, p.language].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <span className={styles.cardTag}>Production</span>
                    </Link>
                  ))}
                </div>
              )}

              {showCharacters && results.characters.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>Characters</div>
                  {results.characters.map((c) => (
                    <Link key={c.id} to={`/characters/${c.id}`} className={styles.resultCard}>
                      <div className={`${styles.avatar} ${styles.avatarChar}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{c.name}</div>
                        <div className={styles.cardMeta}>
                          {c.operaTitle}{c.appearanceCount ? ` · ${c.appearanceCount} appearance${c.appearanceCount !== 1 ? 's' : ''} in archive` : ''}
                        </div>
                      </div>
                      <span className={styles.cardTag}>Character</span>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;