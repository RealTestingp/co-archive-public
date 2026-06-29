import NavBar from '../components/NavBar';
import BreadCrumb from '../components/BreadCrumb';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';

const ReportsPage = () => {

  const stats = [
    { label: 'Persons', value: '—' },
    { label: 'Productions', value: '—' },
    { label: 'Characters', value: '—' },
    { label: 'Seasons', value: '—' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>
      <NavBar />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Reports
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '2rem' }}>
          Overview of the Calgary Opera Archive.
        </p>

        <SectionTitle>Archive Overview</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: '#fff', padding: '1.25rem' }}>
              <div style={{ fontSize: '32px', fontWeight: 600, color: '#d1d5db', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <Divider />

        <SectionTitle>Productions by Season</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Season', 'Productions', 'Persons'].map((h) => (
              <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{h}</span>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
              {['—', '—', '—'].map((v, j) => (
                <span key={j} style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{v}</span>
              ))}
            </div>
          ))}
        </div>

        <Divider />

        <SectionTitle>Most Performed Characters</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Character', 'Production', 'Times Performed'].map((h) => (
              <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{h}</span>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
              {['—', '—', '—'].map((v, j) => (
                <span key={j} style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{v}</span>
              ))}
            </div>
          ))}
        </div>

        <Divider />

        <SectionTitle>Person Milestones</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Person', 'Milestone'].map((h) => (
              <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{h}</span>
            ))}
          </div>
          {[
            { name: 'Person Name', badge: '50th Performance' },
            { name: 'Person Name', badge: '10 Year Anniversary' },
            { name: 'Person Name', badge: '25th Production' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{item.name}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '3px', background: '#9B1C1C', color: '#fff' }}>{item.badge}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;