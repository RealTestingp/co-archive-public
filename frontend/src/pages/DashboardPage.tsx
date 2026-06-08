import { useState } from 'react';
import Navbar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import AddContributorModal from '../components/AddContributorModal';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'Contributors' | 'Productions' | 'Characters'>('Contributors');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = ['Contributors', 'Productions', 'Characters'] as const;

  const tableHeaders = {
    Contributors: ['Name', 'Nationality', 'Voice Type', 'Active Since'],
    Productions: ['Title', 'Composer', 'Season', 'Year'],
    Characters: ['Name', 'Production', 'Voice Type'],
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <Breadcrumb path={['Admin']} current="Dashboard" />

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          Manage Archive
        </h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          {[
            { label: 'Contributors', value: '—' },
            { label: 'Productions', value: '—' },
            { label: 'Characters', value: '—' },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#d1d5db', letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
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
                borderBottom: activeTab === tab ? '2px solid #9B1C1C' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'none',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: '2px',
                borderBottomColor: activeTab === tab ? '#9B1C1C' : 'transparent',
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
            placeholder="Search the archive..."
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}
          />
          <button style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
            Search
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}
          >
            + Add New
          </button>
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
                <button style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>Edit</button>
                <button style={{ fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}>View</button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <AddContributorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};

export default DashboardPage;