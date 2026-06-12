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

const ProductionPage = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [id]);

  const details = [
    { label: 'Composer', value: '—' },
    { label: 'Librettist(s)', value: '—' },
    { label: 'Language', value: '—' },
    { label: 'Duration', value: '—' },
    { label: 'Season', value: '—' },
    { label: 'Year', value: '—' },
  ];

  const castCrew = [
    { name: 'Person Name', role: 'Role / Character', type: 'Cast' },
    { name: 'Person Name', role: 'Role / Character', type: 'Crew' },
    { name: 'Person Name', role: 'Role / Character', type: 'Orchestra' },
    { name: 'Person Name', role: 'Role / Character', type: 'Cast' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      {hasError ? (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
          <Breadcrumb path={['Archive', 'Productions']} current="Production Title" />
          <ErrorState onRetry={() => { setHasError(false); setIsLoading(true); }} />
        </div>
      ) : (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

          <Breadcrumb path={['Archive', 'Productions']} current="Production Title" />

          {/* Header */}
          {isLoading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <LoadingSkeleton width="280px" height="26px" />
                <LoadingSkeleton width="160px" height="14px" />
              </div>
            : <PageHeader title="Production Title" subtitle="Season · Year" editLabel="Edit Production" />
          }

          <Divider />

          {/* Details Row */}
          {isLoading
            ? <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <LoadingSkeleton width="80px" height="10px" />
                    <LoadingSkeleton width="60px" height="14px" />
                  </div>
                ))}
              </div>
            : <DetailRow details={details} />
          }

          <Divider />

          {/* Cast & Crew */}
          <SectionTitle>Cast & Crew</SectionTitle>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Name', 'Role / Character', 'Type'].map((h, i) => (
                <span key={h} style={{ flex: i < 2 ? 1 : 0, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                  {h}
                </span>
              ))}
            </div>
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                    <LoadingSkeleton width="160px" height="13px" />
                    <LoadingSkeleton width="120px" height="13px" />
                    <LoadingSkeleton width="60px" height="13px" />
                  </div>
                ))
              : castCrew.map((member, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < castCrew.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>{member.name}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#d1d5db' }}>{member.role}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '3px' }}>{member.type}</span>
                  </div>
                ))
            }
          </div>

        </div>
      )}
    </div>
  );
};

export default ProductionPage;