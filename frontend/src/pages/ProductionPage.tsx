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

const BASE_URL = 'http://localhost:5166';

interface Performance {
  id: number;
  date: string;
}

interface CastMember {
  firstName: string;
  lastName: string;
  contributorType: string;
  character: string | null;
  position: string | null;
}

interface CrewMember {
  firstName: string;
  lastName: string;
  position: string | null;
}

interface Production {
  id: number;
  title: string;
  season: string;
  eventType: string;
  venue: string;
  opera: string | null;
  composers: string[];
  librettists: string[];
  writtenLanguage: string | null;
  sungLanguage: string | null;
  runtimeMinutes: number | null;
  notes: string | null;
  programPdfUrl: string | null;
  performances: Performance[];
  cast: CastMember[];
  creative: CrewMember[];
  crew: CrewMember[];
  orchestra: { firstName: string; lastName: string }[];
  chorus: { firstName: string; lastName: string }[];
}

const badgeStyle = (type: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: '3px',
  background: '#f3f4f6',
  color: '#6b7280',
});

const ProductionPage = () => {
  const { id } = useParams();
  const [production, setProduction] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchProduction = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`${BASE_URL}/api/productions/${id}`);
      if (!res.ok) throw new Error();
      setProduction(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, [id]);

  const details = production ? [
    { label: 'Composer', value: production.composers.join(', ') || '—' },
    { label: 'Librettist(s)', value: production.librettists.join(', ') || '—' },
    { label: 'Written Language', value: production.writtenLanguage ?? '—' },
    { label: 'Sung Language', value: production.sungLanguage ?? '—' },
    { label: 'Runtime', value: production.runtimeMinutes ? `${production.runtimeMinutes} min` : '—' },
    { label: 'Venue', value: production.venue },
    { label: 'Event Type', value: production.eventType },
    { label: 'Season', value: production.season },
  ] : [];

  const renderPersonTable = (
    members: { firstName: string; lastName: string; position?: string | null; character?: string | null; contributorType?: string }[],
    showRole = false,
    showType = false
  ) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <span style={headerCell}>Name</span>
        {showRole && <span style={headerCell}>Character / Position</span>}
        {showType && <span style={{ ...headerCell, flex: 0, minWidth: '80px' }}>Type</span>}
      </div>
      {members.length === 0 ? (
        <div style={{ padding: '1rem 16px', fontSize: '13px', color: '#9ca3af' }}>None listed.</div>
      ) : members.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < members.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
          <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#111' }}>{m.lastName}, {m.firstName}</span>
          {showRole && (
            <span style={{ flex: 1, fontSize: '13px', color: '#6b7280' }}>
              {m.character ?? m.position ?? '—'}
            </span>
          )}
          {showType && m.contributorType && (
            <span style={badgeStyle(m.contributorType)}>{m.contributorType}</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>
      <NavBar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
       <Breadcrumb path={[{ label: 'Archive', to: '/search' }, { label: 'Productions', to: '/search' }]} current={production?.title ?? 'Production'} />

        {hasError ? (
          <ErrorState onRetry={fetchProduction} />
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
                title={production!.title}
                subtitle={`${production!.season} · ${production!.eventType}`}
                editLabel="Edit Production"
              />
            )}

            <Divider />

            {/* Details */}
            {isLoading ? (
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <LoadingSkeleton width="80px" height="10px" />
                    <LoadingSkeleton width="60px" height="14px" />
                  </div>
                ))}
              </div>
            ) : (
              <DetailRow details={details} />
            )}

            {/* Performances */}
            {!isLoading && production && production.performances.length > 0 && (
              <>
                <Divider />
                <SectionTitle>Performance Dates</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                  {production.performances.map((p) => (
                    <span key={p.id} style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '4px', background: '#f3f4f6', color: '#374151' }}>
                      {new Date(p.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Divider />

            {/* Cast & Crew sections */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} width="100%" height="40px" />)}
              </div>
            ) : production && (
              <>
                {production.cast.length > 0 && (
                  <>
                    <SectionTitle>Cast</SectionTitle>
                    {renderPersonTable(production.cast, true, false)}
                  </>
                )}

                {production.creative.length > 0 && (
                  <>
                    <SectionTitle>Creative Team</SectionTitle>
                    {renderPersonTable(production.creative, true, false)}
                  </>
                )}

                {production.crew.length > 0 && (
                  <>
                    <SectionTitle>Crew</SectionTitle>
                    {renderPersonTable(production.crew, true, false)}
                  </>
                )}

                {production.orchestra.length > 0 && (
                  <>
                    <SectionTitle>Orchestra</SectionTitle>
                    {renderPersonTable(production.orchestra, false, false)}
                  </>
                )}

                {production.chorus.length > 0 && (
                  <>
                    <SectionTitle>Chorus</SectionTitle>
                    {renderPersonTable(production.chorus, false, false)}
                  </>
                )}

                {/* Notes */}
                {production.notes && (
                  <>
                    <Divider />
                    <SectionTitle>Notes</SectionTitle>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{production.notes}</p>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const headerCell: React.CSSProperties = {
  flex: 1,
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#9ca3af',
};

export default ProductionPage;