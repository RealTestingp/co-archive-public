import { useParams } from 'react-router-dom';
import Navbar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';

const PersonPage = () => {
  const { id } = useParams();

  const details = [
    { label: 'Voice Type', value: '—' },
    { label: 'Nationality', value: '—' },
    { label: 'Active Since', value: '—' },
    { label: 'Productions', value: '—' },
  ];

  const productions = [
    { title: 'Production Title', role: 'Role', year: 'Year' },
    { title: 'Production Title', role: 'Role', year: 'Year' },
    { title: 'Production Title', role: 'Role', year: 'Year' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <Breadcrumb path={['Archive', 'Contributors']} current="Person Name" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 500, flexShrink: 0 }}>
              Photo
            </div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#d1d5db', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Person Name
              </h1>
              <div style={{ fontSize: '13px', color: '#d1d5db' }}>Contributor · Nationality</div>
            </div>
          </div>
          <div>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', marginLeft: '8px' }}>
              View History
            </button>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff', marginLeft: '8px' }}>
              Edit Profile
            </button>
          </div>
        </div>

        <Divider />
        <DetailRow details={details} />
        <Divider />

        <SectionTitle>Biography</SectionTitle>
        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Biography will appear here once data is connected.
        </p>

        <Divider />

        <SectionTitle>Productions</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {productions.map((prod, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < productions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>{prod.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '3px' }}>{prod.role}</span>
                <span style={{ fontSize: '12px', color: '#d1d5db' }}>{prod.year}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PersonPage;