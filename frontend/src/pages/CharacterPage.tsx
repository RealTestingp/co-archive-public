import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import PageHeader from '../components/PageHeader';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const CharacterPage = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [id]);

  const details = [
    { label: 'Voice Type', value: '—' },
    { label: 'Production', value: '—' },
    { label: 'Times Performed', value: '—' },
  ];

  const performers = [
    { name: 'Person Name', production: 'Production Title', year: 'Year' },
    { name: 'Person Name', production: 'Production Title', year: 'Year' },
    { name: 'Person Name', production: 'Production Title', year: 'Year' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      {hasError ? (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
          <Breadcrumb path={['Archive', 'Characters']} current="Character Name" />
          <ErrorState onRetry={() => { setHasError(false); setIsLoading(true); }} />
        </div>
      ) : (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

          <Breadcrumb path={['Archive', 'Characters']} current="Character Name" />

          {/* Header */}
          {isLoading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <LoadingSkeleton width="280px" height="26px" />
                <LoadingSkeleton width="160px" height="14px" />
              </div>
            : <PageHeader title="Character Name" subtitle="Production Title" editLabel="Edit Character" />
          }

          <Divider />

          {/* Details Row */}
          {isLoading
            ? <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <LoadingSkeleton width="80px" height="10px" />
                    <LoadingSkeleton width="60px" height="14px" />
                  </div>
                ))}
              </div>
            : <DetailRow details={details} />
          }

          <Divider />

          {/* Description */}
          <SectionTitle>Description</SectionTitle>
          {isLoading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <LoadingSkeleton width="100%" height="14px" />
                <LoadingSkeleton width="85%" height="14px" />
                <LoadingSkeleton width="70%" height="14px" />
              </div>
            : <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                Character description will appear here once data is connected.
              </p>
          }

          <Divider />

          {/* Performed By */}
          <SectionTitle>Performed By</SectionTitle>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Person', 'Production', 'Year'].map((h, i) => (
                <span key={h} style={{ flex: i < 2 ? 1 : 0, minWidth: i === 2 ? '48px' : 'auto', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  {h}
                </span>
              ))}
            </div>
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                    <LoadingSkeleton width="160px" height="13px" />
                    <LoadingSkeleton width="140px" height="13px" />
                    <LoadingSkeleton width="40px" height="13px" />
                  </div>
                ))
              : performers.map((performer, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < performers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>{performer.name}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{performer.production}</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db', minWidth: '48px' }}>{performer.year}</span>
                  </div>
                ))
            }
          </div>

        </div>
      )}
    </div>
  );
};

export default CharacterPage;