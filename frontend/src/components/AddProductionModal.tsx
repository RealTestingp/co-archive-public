import { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:5166';

interface LookupItem {
  id: number;
  name?: string;
  label?: string;
  title?: string;
}

interface Lookups {
  seasons: LookupItem[];
  venues: LookupItem[];
  eventTypes: LookupItem[];
  operas: LookupItem[];
  languages: LookupItem[];
}

interface FormState {
  title: string;
  seasonId: string;
  eventTypeId: string;
  venueId: string;
  operaId: string;
  writtenLanguageId: string;
  sungLanguageId: string;
  runtimeMinutes: string;
  notes: string;
  programPdfUrl: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  seasonId: '',
  eventTypeId: '',
  venueId: '',
  operaId: '',
  writtenLanguageId: '',
  sungLanguageId: '',
  runtimeMinutes: '',
  notes: '',
  programPdfUrl: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#111',
};

const selectStyle = {
  ...inputStyle,
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#6b7280',
  marginBottom: '5px',
  display: 'block',
};

const fieldWrap = { marginBottom: '1.1rem' };

const AddProductionModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lookups, setLookups] = useState<Lookups>({ seasons: [], venues: [], eventTypes: [], operas: [], languages: [] });
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [seasons, venues, eventTypes, operas, languages] = await Promise.all([
          fetch(`${BASE_URL}/api/seasons`).then(r => r.json()),
          fetch(`${BASE_URL}/api/venues`).then(r => r.json()),
          fetch(`${BASE_URL}/api/eventtypes`).then(r => r.json()),
          fetch(`${BASE_URL}/api/operas`).then(r => r.json()),
          fetch(`${BASE_URL}/api/languages`).then(r => r.json()),
        ]);
        setLookups({ seasons, venues, eventTypes, operas, languages });
      } catch {
        setError('Failed to load form options. Is the API running?');
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, [isOpen]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.seasonId || !form.eventTypeId || !form.venueId) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/api/productions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          seasonId: Number(form.seasonId),
          eventTypeId: Number(form.eventTypeId),
          venueId: Number(form.venueId),
          operaId: form.operaId ? Number(form.operaId) : null,
          writtenLanguageId: form.writtenLanguageId ? Number(form.writtenLanguageId) : null,
          sungLanguageId: form.sungLanguageId ? Number(form.sungLanguageId) : null,
          runtimeMinutes: form.runtimeMinutes ? Number(form.runtimeMinutes) : null,
          notes: form.notes.trim() || null,
          programPdfUrl: form.programPdfUrl.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create production.');

      setForm(EMPTY_FORM);
      onSuccess?.();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>Add Production</h2>
          <button onClick={handleClose} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
        </div>

        {loadingLookups ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '13px', color: '#6b7280' }}>Loading form options...</div>
        ) : (
          <>
            {/* Title */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Production Title <span style={{ color: '#9B1C1C' }}>*</span></label>
              <input type="text" placeholder="e.g. Tosca" style={inputStyle} value={form.title} onChange={set('title')} />
            </div>

            {/* Season + Event Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={labelStyle}>Season <span style={{ color: '#9B1C1C' }}>*</span></label>
                <select style={selectStyle} value={form.seasonId} onChange={set('seasonId')}>
                  <option value="">Select season</option>
                  {lookups.seasons.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Event Type <span style={{ color: '#9B1C1C' }}>*</span></label>
                <select style={selectStyle} value={form.eventTypeId} onChange={set('eventTypeId')}>
                  <option value="">Select type</option>
                  {lookups.eventTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>

            {/* Venue */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Venue <span style={{ color: '#9B1C1C' }}>*</span></label>
              <select style={selectStyle} value={form.venueId} onChange={set('venueId')}>
                <option value="">Select venue</option>
                {lookups.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            {/* Opera */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Opera</label>
              <select style={selectStyle} value={form.operaId} onChange={set('operaId')}>
                <option value="">Select opera</option>
                {lookups.operas.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>

            {/* Written + Sung Language */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={labelStyle}>Written Language</label>
                <select style={selectStyle} value={form.writtenLanguageId} onChange={set('writtenLanguageId')}>
                  <option value="">Select language</option>
                  {lookups.languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sung Language</label>
                <select style={selectStyle} value={form.sungLanguageId} onChange={set('sungLanguageId')}>
                  <option value="">Select language</option>
                  {lookups.languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {/* Runtime */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Runtime (minutes)</label>
              <input type="number" placeholder="e.g. 150" style={inputStyle} value={form.runtimeMinutes} onChange={set('runtimeMinutes')} min={0} />
            </div>

            {/* Notes */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Notes</label>
              <textarea placeholder="Any additional notes..." style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} value={form.notes} onChange={set('notes')} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ fontSize: '12px', color: '#9B1C1C', marginBottom: '1rem', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}><span style={{ color: '#9B1C1C' }}>*</span> Required fields</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleClose} disabled={submitting} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: submitting ? '#c85a5a' : '#9B1C1C', color: '#fff' }}>
                  {submitting ? 'Saving...' : 'Add Production'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddProductionModal;