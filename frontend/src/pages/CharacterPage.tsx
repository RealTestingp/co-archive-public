import { useParams } from 'react-router-dom';
import Navbar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import PageHeader from '../components/PageHeader';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';

const CharacterPage = () => {
  const { id } = useParams();

  const details = [
    { label: 'Voice Type', value: '—' },
    { label: 'Production', value: '—' },
    { label: 'Times Performed', value: '—' },
  ];

  const performers = [
    { name: 'Contributor Name', production: 'Production Title', year: 'Year' },
    { name: 'Contributor Name', production: 'Production Title', year: 'Year' },
    { name: 'Contributor Name', production: 'Production Title', year: 'Year' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <Breadcrumb path={['Archive', 'Characters']} current="Character Name" />
        <PageHeader title="Character Name" subtitle="Production Title" editLabel="Edit Character" />
        <Divider />
        <DetailRow details={details} />
        <Divider />

        <SectionTitle>Description</SectionTitle>
        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Character description will appear here once data is connected.
        </p>

        <Divider />

        <SectionTitle>Performed By</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Contributor', 'Production', 'Year'].map((h, i) => (
              <span key={h} style={{ flex: i < 2 ? 1 : 0, minWidth: i === 2 ? '48px' : 'auto', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                {h}
              </span>
            ))}
          </div>
          {performers.map((performer, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < performers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>{performer.name}</span>
              <span style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{performer.production}</span>
              <span style={{ fontSize: '12px', color: '#d1d5db', minWidth: '48px' }}>{performer.year}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CharacterPage;