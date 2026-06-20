import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import AddPersonModal from '../components/AddPersonModal';
import AddProductionModal from '../components/AddProductionModal';
import AddCharacterModal from '../components/AddCharacterModal';

const BASE_URL = 'http://localhost:5166';

type Tab = 'Persons' | 'Productions' | 'Characters';

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
  productionTitle?: string;
}

const ManageArchivePage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Persons');
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState('');

  const [persons, setPersons] = useState<Person[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  const navigate = useNavigate();

  const fetchData = useCallback(async (tab: Tab, searchTerm = '') => {
    setIsLoading(true);
    setHasError(false);
    try {
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      if (tab === 'Persons') {
        const res = await fetch(`${BASE_URL}/api/persons${q}`);
        if (!res.ok) throw new Error();
        setPersons(await res.json());
      } else if (tab === 'Productions') {
        const res = await fetch(`${BASE_URL}/api/productions${q}`);
        if (!res.ok) throw new Error();
        setProductions(await res.json());
      } else {
        const res = await fetch(`${BASE_URL}/api/characters${q}`);
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

  const handleSearch = () => fetchData(activeTab, search);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch('');
  };

  const handleAddNew = () => {
    if (activeTab === 'Persons') setIsPersonModalOpen(true);
    if (activeTab === 'Productions') setIsProductionModalOpen(true);
    if (activeTab === 'Characters') setIsCharacterModalOpen(true);
  };

  const handleView = (id: number) => {
    if (activeTab === 'Persons') navigate(`/person/${id}`);
    if (activeTab === 'Productions') navigate(`/production/${id}`);
    if (activeTab === 'Characters') navigate(`/character/${id}`);
  };

  const tabs: Tab[] = ['Persons', 'Productions', 'Characters'];

  const counts = {
    Persons: persons.length,
    Productions: productions.length,
    Characters: characters.length,
  };

  const renderRows = () => {
    if (activeTab === 'Persons') {
      return persons.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < persons.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <span style={{ flex: 2, fontSize: '13px', fontWeight: 500, color: '#111' }}>{p.lastName}, {p.firstName}</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.voiceType ?? '—'}</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.contributorTypes.join(', ') || '—'}</span>
          <span style={{ flex: 1, fontSize: '13px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '3px', background: p.isActive ? '#f0fdf4' : '#f9fafb', color: p.isActive ? '#16a34a' : '#9ca3af' }}>
              {p.isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
          <div style={{ display: 'flex', gap: '6px', minWidth: '100px', justifyContent: 'flex-end' }}>
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(p.id)} style={viewBtnStyle}>View</button>
          </div>
        </div>
      ));
    }

    if (activeTab === 'Productions') {
      return productions.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < productions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <span style={{ flex: 2, fontSize: '13px', fontWeight: 500, color: '#111' }}>{p.title}</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.season}</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.eventType}</span>
          <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.venue}</span>
          <div style={{ display: 'flex', gap: '6px', minWidth: '100px', justifyContent: 'flex-end' }}>
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(p.id)} style={viewBtnStyle}>View</button>
          </div>
        </div>
      ));
    }

    if (activeTab === 'Characters') {
      return characters.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < characters.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <span style={{ flex: 2, fontSize: '13px', fontWeight: 500, color: '#111' }}>{c.name}</span>
          <span style={{ flex: 2, fontSize: '13px', color: '#6b7280' }}>{c.productionTitle ?? '—'}</span>
          <div style={{ display: 'flex', gap: '6px', minWidth: '100px', justifyContent: 'flex-end' }}>
            <button style={editBtnStyle}>Edit</button>
            <button onClick={() => handleView(c.id)} style={viewBtnStyle}>View</button>
          </div>
        </div>
      ));
    }
  };

  const tableHeaders = {
    Persons: ['Name', 'Voice Type', 'Contributor Type', 'Status', ''],
    Productions: ['Title', 'Season', 'Event Type', 'Venue', ''],
    Characters: ['Name', 'Production', ''],
  };

  const emptyMessage = {
    Persons: 'No persons found.',
    Productions: 'No productions found.',
    Characters: 'No characters found.',
  };

  const hasData = {
    Persons: persons.length > 0,
    Productions: productions.length > 0,
    Characters: characters.length > 0,
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>
      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
        <Breadcrumb path={[{ label: 'Admin', to: '/manage' }]} current="Manage Archive" />

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          Manage Archive
        </h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          {tabs.map((tab) => (
            <div key={tab}>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
                {isLoading && activeTab === tab ? <LoadingSkeleton width="48px" height="28px" /> : counts[tab]}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginTop: '4px' }}>{tab}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
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

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}
          />
          <button onClick={handleSearch} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
            Search
          </button>
          <button onClick={handleAddNew} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}>
            + Add New
          </button>
        </div>

        {/* Table */}
        {hasError ? (
          <ErrorState onRetry={() => fetchData(activeTab, search)} />
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {tableHeaders[activeTab].map((h, i) => (
                <span key={i} style={{ flex: h === '' ? 0 : i === 0 ? 2 : 1, minWidth: h === '' ? '100px' : undefined, textAlign: h === '' ? 'right' : 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  {h === '' ? 'Actions' : h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                    <LoadingSkeleton width="100%" height="13px" />
                    <LoadingSkeleton width="100%" height="13px" />
                    <LoadingSkeleton width="100%" height="13px" />
                    <div style={{ display: 'flex', gap: '6px', minWidth: '100px', justifyContent: 'flex-end' }}>
                      <LoadingSkeleton width="40px" height="26px" borderRadius="4px" />
                      <LoadingSkeleton width="40px" height="26px" borderRadius="4px" />
                    </div>
                  </div>
                ))
              : !hasData[activeTab]
                ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>{emptyMessage[activeTab]}</div>
                : renderRows()
            }
          </div>
        )}
      </div>

      <AddPersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSuccess={() => fetchData('Persons', search)}
      />
      <AddProductionModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        onSuccess={() => fetchData('Productions', search)}
      />
      <AddCharacterModal isOpen={isCharacterModalOpen} onClose={() => setIsCharacterModalOpen(false)} />
    </div>
  );
};

const editBtnStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px',
  cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
};

const viewBtnStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px',
  cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff',
};

export default ManageArchivePage;