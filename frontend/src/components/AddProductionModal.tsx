interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const languages = ['Italian', 'German', 'French', 'English', 'Russian', 'Spanish'];

const AddProductionModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
  };

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
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>Add Production</h2>
          <button onClick={onClose} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={labelStyle}>Production Title <span style={{ color: '#9B1C1C' }}>*</span></label>
          <input type="text" placeholder="e.g. Tosca" style={inputStyle} />
        </div>

        {/* Composer + Librettist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Composer <span style={{ color: '#9B1C1C' }}>*</span></label>
            <input type="text" placeholder="e.g. Puccini" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Librettist(s) <span style={{ color: '#9B1C1C' }}>*</span></label>
            <input type="text" placeholder="e.g. Luigi Illica" style={inputStyle} />
          </div>
        </div>

        {/* Season + Year */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Season <span style={{ color: '#9B1C1C' }}>*</span></label>
            <input type="text" placeholder="e.g. 2001-2002" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Year <span style={{ color: '#9B1C1C' }}>*</span></label>
            <input type="text" placeholder="e.g. 2001" style={inputStyle} />
          </div>
        </div>

        {/* Language + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Language</label>
            <select style={selectStyle}>
              <option value="">Select language</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <input type="text" placeholder="e.g. 2h 30m" style={inputStyle} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}><span style={{ color: '#9B1C1C' }}>*</span> Required fields</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }}>
              Cancel
            </button>
            <button style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff' }}>
              Add Production
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddProductionModal;