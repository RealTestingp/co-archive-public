import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Breadcrumb from '../components/BreadCrumb';
import PageHeader from '../components/PageHeader';
import DetailRow from '../components/DetailRow';
import SectionTitle from '../components/SectionTitle';
import Divider from '../components/Divider';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const BASE_URL = 'http://localhost:5166';

interface Performer {
  firstName: string;
  lastName: string;
  contributorType: string;
}

interface ProductionHistory {
  productionId: number;
  productionTitle: string;
  season: string;
  performers: Performer[];
}

interface Character {
  id: number;
  name: string;
  opera: string;
  operaId: number | null;
  productionHistory: ProductionHistory[];
}

const CharacterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchCharacter = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`${BASE_URL}/api/characters/${id}`);
      if (!res.ok) throw new Error();
      setCharacter(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  const details = character ? [
    { label: 'Opera', value: character.opera ?? '—' },
    { label: 'Productions', value: String(character.productionHistory.length) },
  ] : [];

  const totalPerformers = character
    ? character.productionHistory.reduce((acc, p) => acc + p.performers.length, 0)
    : 0;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>
      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
        <Breadcrumb
          path={[{ label: 'Archive', to: '/search' }, { label: 'Characters', to: '/search' }]}
          current={character?.name ?? 'Character'}
        />

        {hasError ? (
          <ErrorState onRetry={fetchCharacter} />
        ) : (
          <>
            {/* Header */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <LoadingSkeleton width="280px" height="26px" />
                <LoadingSkeleton width="160px" height="14px" />
              </div>
            ) : (
              <PageHeader
                title={character!.name}
                subtitle={character!.opera ?? ''}
                editLabel="Edit Character"
              />
            )}

            <Divider />

            {/* Details */}
            {isLoading ? (
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <LoadingSkeleton width="80px" height="10px" />
                    <LoadingSkeleton width="60px" height="14px" />
                  </div>
                ))}
              </div>
            ) : (
              <DetailRow details={details} />
            )}

            <Divider />

            {/* Production History */}
            <SectionTitle>Production History</SectionTitle>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <LoadingSkeleton width="200px" height="13px" />
                </div>
              ))
            ) : !character || character.productionHistory.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>No production history on record.</p>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Production', 'Season', 'Performers'].map(h => (
                    <span key={h} style={{ flex: 1, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#9ca3af' }}>{h}</span>
                  ))}
                </div>
                {character.productionHistory.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/production/${p.productionId}`)}
                    style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < character.productionHistory.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#111' }}>{p.productionTitle}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>{p.season}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>
                      {p.performers.map(p => `${p.firstName} ${p.lastName}`).join(', ') || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterPage;