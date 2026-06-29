import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, colors } = useTheme();

  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchPerson = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/persons/${id}`);
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
  const initials = person ? `${person.firstName[0]}${person.lastName[0]}`.toUpperCase() : '';

  const details = person ? [
    { label: 'Voice Type', value: person.voiceType ?? '—' },
    { label: 'Nationality', value: person.nationalities.join(', ') || '—' },
    { label: 'Contributor Type', value: person.contributorTypes.join(', ') || '—' },
    { label: 'Status', value: person.isActive ? 'Active' : 'Inactive' },
  ] : [];

  const metrics = person ? [
    { label: 'Performances', value: person.performanceCount },
    { label: 'Productions', value: person.mainStageProductionCount },
    { label: 'Seasons Active', value: new Set(person.appearances.map(a => a.season)).size },
  ] : [];

  // Theme-aware colours
  const border = isDark ? '#2a2a2a' : '#e5e7eb';
  const borderLight = isDark ? '#2a2a2a' : '#f3f4f6';
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  const surface = isDark ? '#1c1c1c' : '#fff';
  const tableBg = isDark ? '#161616' : '#f9fafb';
  const rowHover = isDark ? '#1e1e1e' : '#fafafa';
  const metricBg = isDark ? '#1c1c1c' : '#fff';
  const metricDivider = isDark ? '#2a2a2a' : '#e5e7eb';

  return (
    <div style={{ background: colors.background, minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: textPrimary }}>
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

                {/* Avatar — display only */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `1.5px solid ${isDark ? '#3a3a3a' : '#e5e7eb'}`,
                  background: isDark ? '#2a2a2a' : '#f3e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {person?.profileImageUrl ? (
                    <img
                      src={person.profileImageUrl}
                      alt={fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px', color: '#9B1C1C', fontWeight: 500 }}>
                      {isLoading ? '' : initials}
                    </span>
                  )}
                </div>

                {/* Name + subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isLoading
                    ? <LoadingSkeleton width="200px" height="26px" />
                    : <h1 style={{ fontSize: '22px', fontWeight: 700, color: textPrimary, letterSpacing: '-0.02em' }}>{fullName}</h1>
                  }
                  {isLoading
                    ? <LoadingSkeleton width="140px" height="14px" />
                    : <div style={{ fontSize: '13px', color: textSecondary }}>
                        {person?.contributorTypes.join(', ') || '—'}
                        {person?.nationalities.length ? ` · ${person.nationalities.join(', ')}` : ''}
                      </div>
                  }
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${border}`, background: surface, color: textSecondary, fontFamily: 'Inter, sans-serif' }}>
                  View History
                </button>
                <button style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  Edit Profile
                </button>
              </div>
            </div>

            <Divider />

            {/* Details */}
            {isLoading
              ? <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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

            {/* Milestone Metrics */}
            {!isLoading && person && (
              <>
                <SectionTitle>Milestones</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: metricDivider, border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  {metrics.map((m) => (
                    <div key={m.label} style={{ background: metricBg, padding: '1.25rem' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: textPrimary, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: textMuted }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isLoading && (
              <>
                <div style={{ height: '16px', marginBottom: '0.75rem' }}><LoadingSkeleton width="100px" height="13px" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', marginBottom: '1.5rem' }}>
                  {[1, 2, 3].map(i => <LoadingSkeleton key={i} width="100%" height="72px" />)}
                </div>
              </>
            )}

            <Divider />

            {/* Production History */}
            <SectionTitle>Production History</SectionTitle>
            {isLoading
              ? [1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${borderLight}` }}>
                    <LoadingSkeleton width="200px" height="13px" />
                    <LoadingSkeleton width="80px" height="13px" />
                  </div>
                ))
              : !person || person.appearances.length === 0
                ? <p style={{ fontSize: '13px', color: textMuted, marginBottom: '1.5rem' }}>No productions on record.</p>
                : (
                  <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', padding: '8px 16px', background: tableBg, borderBottom: `1px solid ${border}` }}>
                      {['Production', 'Season', 'Role'].map(h => (
                        <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: textMuted }}>{h}</span>
                      ))}
                    </div>
                    {person.appearances.map((a, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/productions/${a.productionId}`)}
                        style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < person.appearances.length - 1 ? `1px solid ${borderLight}` : 'none', cursor: 'pointer', transition: 'background 0.1s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: textPrimary }}>{a.productionTitle}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: textSecondary }}>{a.season}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: textSecondary }}>
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