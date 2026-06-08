import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';
import LoadingSkeleton from '../components/LoadingSkeleton';

const PersonPage = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // simulate API call — replace with real fetch later
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [id]);

  const details = [
    { label: 'Voice Type', value: '—' },
    { label: 'Nationality', value: '—' },
    { label: 'Active Since', value: '—' },
    { label: 'Productions', value: '—' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        <Breadcrumb path={['Archive', 'Contributors']} current="Person Name" />

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 500, flexShrink: 0 }}>
              {isLoading ? '' : 'Photo'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {isLoading
                ? <LoadingSkeleton width="200px" height="26px" />
                : <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#d1d5db', letterSpacing: '-0.02em' }}>Person Name</h1>
              }
              {isLoading
                ? <LoadingSkeleton width="140px" height="14px" />
                : <div style={{ fontSize: '13px', color: '#d1d5db' }}>Contributor · Nationality</div>
              }
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

        {/* Details Row */}
        {isLoading
          ? <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <LoadingSkeleton width="80px" height="10px" />
                  <LoadingSkeleton width="60px" height="14px" />
                </div>
              ))}
            </div>
          : <DetailRow details={details} />
        }

        <Divider />

        {/* Biography */}
        <SectionTitle>Biography</SectionTitle>
        {isLoading
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
              <LoadingSkeleton width="100%" height="14px" />
              <LoadingSkeleton width="90%" height="14px" />
              <LoadingSkeleton width="75%" height="14px" />
            </div>
          : <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>
              Biography will appear here once data is connected.
            </p>
        }

        <Divider />

        {/* Productions */}
        <SectionTitle>Productions</SectionTitle>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <LoadingSkeleton width="160px" height="13px" />
                  <LoadingSkeleton width="60px" height="13px" />
                </div>
              ))
            : [1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>Production Title</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '3px' }}>Role</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>Year</span>
                  </div>
                </div>
              ))
          }
        </div>

      </div>
    </div>
  );
};

export default PersonPage;