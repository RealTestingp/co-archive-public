import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const BASE_URL = 'http://localhost:5166';

interface Appearance {
  productionId: number;
  productionTitle: string;
  season: string;
  eventType: string;
  roles: {
    contributorType: string;
    character: string | null;
    position: string | null;
  }[];
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  isActive: boolean;
  profileImageUrl: string | null;
  voiceType: string | null;
  nationalities: string[];
  contributorTypes: string[];
  appearances: Appearance[];
  mainStageProductionCount: number;
  performanceCount: number;
}

const PersonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchPerson = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`${BASE_URL}/api/persons/${id}`);
      if (!res.ok) throw new Error();
      setPerson(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  const fullName = person ? `${person.firstName} ${person.lastName}` : 'Person';

  const details = person ? [
    { label: 'Voice Type', value: person.voiceType ?? '—' },
    { label: 'Nationality', value: person.nationalities.join(', ') || '—' },
    { label: 'Contributor Type', value: person.contributorTypes.join(', ') || '—' },
    { label: 'Status', value: person.isActive ? 'Active' : 'Inactive' },
    { label: 'MainStage Productions', value: String(person.mainStageProductionCount) },
    { label: 'Performances', value: String(person.performanceCount) },
  ] : [];

  const initials = person
    ? `${person.firstName[0]}${person.lastName[0]}`.toUpperCase()
    : '';

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>
      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
        <Breadcrumb
          path={[{ label: 'Archive', to: '/search' }, { label: 'Persons', to: '/search' }]}
          current={fullName}
        />

        {hasError ? (
          <ErrorState onRetry={fetchPerson} />
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f3e8e8', border: '1.5px solid #9B1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#9B1C1C', fontWeight: 600, flexShrink: 0 }}>
                  {isLoading ? '' : initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isLoading
                    ? <LoadingSkeleton width="200px" height="26px" />
                    : <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>{fullName}</h1>
                  }
                  {isLoading
                    ? <LoadingSkeleton width="140px" height="14px" />
                    : <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {person?.contributorTypes.join(', ') || '—'}
                        {person?.nationalities.length ? ` · ${person.nationalities.join(', ')}` : ''}
                      </div>
                  }
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
                  View History
                </button>
                <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}>
                  Edit Profile
                </button>
              </div>
            </div>

            <Divider />

            {/* Details */}
            {isLoading
              ? <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <LoadingSkeleton width="80px" height="10px" />
                      <LoadingSkeleton width="60px" height="14px" />
                    </div>
                  ))}
                </div>
              : <DetailRow details={details} />
            }

            <Divider />

            {/* Appearances */}
            <SectionTitle>Productions</SectionTitle>
            {isLoading
              ? [1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <LoadingSkeleton width="200px" height="13px" />
                    <LoadingSkeleton width="80px" height="13px" />
                  </div>
                ))
              : !person || person.appearances.length === 0
                ? <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>No productions on record.</p>
                : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['Production', 'Season', 'Role'].map(h => (
                        <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#9ca3af' }}>{h}</span>
                      ))}
                    </div>
                    {person.appearances.map((a, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/production/${a.productionId}`)}
                        style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < person.appearances.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#111' }}>{a.productionTitle}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{a.season}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>
                          {a.roles.map(r => r.character ?? r.position ?? r.contributorType).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            }
          </>
        )}
      </div>
    </div>
  );
};

export default PersonPage;