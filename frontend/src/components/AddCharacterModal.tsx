interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddCharacterModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>Add Character</h2>
          <button onClick={onClose} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
        </div>

        {/* Character Name */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '5px', display: 'block' }}>
            Character Name <span style={{ color: '#9B1C1C' }}>*</span>
          </label>
          <input type="text" placeholder="e.g. Violetta" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
        </div>

        {/* Production + Voice Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '5px', display: 'block' }}>
              Production <span style={{ color: '#9B1C1C' }}>*</span>
            </label>
            <input type="text" placeholder="e.g. La Traviata" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '5px', display: 'block' }}>
              Voice Type <span style={{ color: '#9B1C1C' }}>*</span>
            </label>
            <input type="text" placeholder="e.g. Soprano" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '5px', display: 'block' }}>
            Description
          </label>
          <textarea
            placeholder="Brief description of the character..."
            rows={3}
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
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
              Add Character
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddCharacterModal;