interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const voiceTypes = ['Soprano', 'Mezzo-soprano', 'Contralto', 'Tenor', 'Baritone', 'Bass'];

const AddContributorModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>Add Contributor</h2>
          <button onClick={onClose} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
        </div>

        {/* Full Name */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={labelStyle}>Full Name <span style={{ color: '#9B1C1C' }}>*</span></label>
          <input type="text" placeholder="e.g. Maria Callas" style={inputStyle} />
        </div>

        {/* Nationality + Voice Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Nationality <span style={{ color: '#9B1C1C' }}>*</span></label>
            <input type="text" placeholder="e.g. Greek-American" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Voice Type <span style={{ color: '#9B1C1C' }}>*</span></label>
            <select style={selectStyle}>
              <option value="">Select voice type</option>
              {voiceTypes.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Since */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={labelStyle}>Active Since</label>
          <input type="text" placeholder="e.g. 1941" style={inputStyle} />
        </div>

        {/* Biography */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={labelStyle}>Biography</label>
          <textarea
            placeholder="Brief biography or notes..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}><span style={{ color: '#9B1C1C' }}>*</span> Required fields</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
              Cancel
            </button>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}>
              Add Contributor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddContributorModal;