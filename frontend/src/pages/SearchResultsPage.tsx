import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import BreadCrumb from '../components/BreadCrumb';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'Productions' | 'Contributors' | 'Characters'>(
    (searchParams.get('tab') as 'Productions' | 'Contributors' | 'Characters') || 'Productions'
  );
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();

  const tabs = ['Productions', 'Contributors', 'Characters'] as const;

  const tableHeaders = {
    Productions: ['Title', 'Composer', 'Librettist', 'Language', 'Year', 'Season'],
    Contributors: ['Name', 'Nationality', 'Voice Type', 'Active Since'],
    Characters: ['Name', 'Production', 'Voice Type'],
  };

  const filters = {
    Productions: ['Year', 'Language', 'Season'],
    Contributors: ['Voice Type', 'Nationality'],
    Characters: ['Voice Type', 'Production'],
  };

  const handleView = (i: number) => {
    if (activeTab === 'Productions') navigate(`/production/${i}`);
    if (activeTab === 'Contributors') navigate(`/person/${i}`);
    if (activeTab === 'Characters') navigate(`/character/${i}`);
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search/results?q=${encodeURIComponent(query)}&tab=${activeTab}`);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <BreadCrumb path={['Archive', 'Search']} current="Results" />

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Search Results
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Searching across <strong>{activeTab}</strong>
        </p>

        {/* Search Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by title, name, or keyword..."
            style={{ flex: 1, padding: '9px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', color: '#111' }}
          />
          <button
            onClick={() => navigate('/search')}
            style={{ fontSize: '12px', fontWeight: 500, padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'Inter, sans-serif' }}
          >
            ← New Search
          </button>
          <button
            onClick={handleSearch}
            style={{ background: '#9B1C1C', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '9px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
          >
            Search
          </button>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginRight: '4px' }}>
            Filter by
          </span>
          {filters[activeTab].map((filter) => (
            <select
              key={filter}
              style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}
            >
              <option>{filter}</option>
            </select>
          ))}
          <button
            style={{ fontSize: '11px', color: '#9B1C1C', cursor: 'pointer', fontWeight: 500, border: 'none', background: 'none', fontFamily: 'Inter, sans-serif', marginLeft: '4px' }}
          >
            Clear filters
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.25rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 16px',
                cursor: 'pointer',
                color: activeTab === tab ? '#9B1C1C' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #9B1C1C' : '2px solid transparent',
                marginBottom: '-1px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1rem' }}>
          <strong style={{ color: '#9B1C1C' }}>—</strong> results {query && `for "${query}"`}
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {tableHeaders[activeTab].map((h) => (
              <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                {h}
              </span>
            ))}
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', minWidth: '100px', textAlign: 'right' }}>
              Actions
            </span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
              {tableHeaders[activeTab].map((h) => (
                <span key={h} style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>—</span>
              ))}
              <div style={{ display: 'flex', gap: '6px', minWidth: '100px', justifyContent: 'flex-end' }}>
                <button style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
                  Edit
                </button>
                <button
                  onClick={() => handleView(i)}
                  style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SearchResultsPage;