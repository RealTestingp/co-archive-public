import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState<'Productions' | 'Contributors' | 'Characters'>('Productions');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const tabs = ['Productions', 'Contributors', 'Characters'] as const;

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search/results?q=${encodeURIComponent(query)}&tab=${activeTab}`);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem 6rem', textAlign: 'center' }}>

        {/* Eyebrow */}
        <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B1C1C', marginBottom: '1rem' }}>
          Calgary Opera Archive
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '52px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Explore the Archive
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Search productions, contributors, and characters spanning decades of performance.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '8px 20px',
                cursor: 'pointer',
                borderRight: tab !== 'Characters' ? '1px solid #e5e7eb' : 'none',
                border: 'none',
                background: activeTab === tab ? '#9B1C1C' : '#fff',
                color: activeTab === tab ? '#fff' : '#6b7280',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', width: '100%', maxWidth: '680px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${activeTab.toLowerCase()} by title, name, or keyword...`}
            style={{ flex: 1, padding: '10px 14px', fontSize: '14px', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#111' }}
          />
          <button
            onClick={handleSearch}
            style={{ background: '#9B1C1C', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '10px 20px', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
          >
            Search
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchPage;