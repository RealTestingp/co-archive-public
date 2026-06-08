import { useParams } from 'react-router-dom';
import Navbar from '../components/NavBar';

const ProductionPage = () => {
  const { id } = useParams();

  const details = [
    { label: 'Composer', value: '—' },
    { label: 'Librettist(s)', value: '—' },
    { label: 'Language', value: '—' },
    { label: 'Duration', value: '—' },
    { label: 'Season', value: '—' },
    { label: 'Year', value: '—' },
  ];

  const castCrew = [
    { name: 'Contributor Name', role: 'Role / Character', type: 'Cast' },
    { name: 'Contributor Name', role: 'Role / Character', type: 'Crew' },
    { name: 'Contributor Name', role: 'Role / Character', type: 'Orchestra' },
    { name: 'Contributor Name', role: 'Role / Character', type: 'Cast' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Archive / Productions / <span style={{ color: '#9B1C1C', fontWeight: 500 }}>Production Title</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#d1d5db', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Production Title
            </h1>
            <div style={{ fontSize: '13px', color: '#d1d5db' }}>Season · Year</div>
          </div>
          <div>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', marginLeft: '8px' }}>
              View History
            </button>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff', marginLeft: '8px' }}>
              Edit Production
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', margin: '1.5rem 0' }} />

        {/* Details Row */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {details.map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '3px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#d1d5db' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', margin: '1.5rem 0' }} />

        {/* Cast & Crew */}
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '10px' }}>
          Cast & Crew
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>

          {/* Table Header */}
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Name', 'Role / Character', 'Type'].map((h) => (
              <span key={h} style={{ flex: h === 'Type' ? 0 : 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Table Rows */}
          {castCrew.map((member, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < castCrew.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>{member.name}</span>
              <span style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{member.role}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '3px' }}>{member.type}</span>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default ProductionPage;