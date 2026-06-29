import { useState, useEffect, useRef } from 'react';

interface LookupItem {
  id: number;
  name: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  voiceTypeId: string;
  nationalityIds: number[];
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  voiceTypeId: '',
  nationalityIds: [],
  isActive: true,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#111',
  background: '#fff',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  color: '#374151',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '12px',
  paddingRight: '32px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6b7280',
  marginBottom: '5px',
  display: 'block',
};

const fieldWrap: React.CSSProperties = { marginBottom: '1.1rem' };

const AddPersonModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [voiceTypes, setVoiceTypes] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [vt, nat] = await Promise.all([
          fetch(`/api/voicetypes`).then(r => r.json()),
          fetch(`/api/nationalities`).then(r => r.json()),
        ]);
        setVoiceTypes(vt);
        setNationalities(nat);
      } catch {
        setError('Failed to load form options. Is the API running?');
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, [isOpen]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleNationality = (id: number) => {
    setForm(prev => ({
      ...prev,
      nationalityIds: prev.nationalityIds.includes(id)
        ? prev.nationalityIds.filter(n => n !== id)
        : [...prev.nationalityIds, id],
    }));
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Derive initials from form for preview
  const previewInitials = [form.firstName[0], form.lastName[0]].filter(Boolean).join('').toUpperCase();

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the person
      const res = await fetch(`/api/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || null,
          email: form.email.trim() || null,
          voiceTypeId: form.voiceTypeId ? Number(form.voiceTypeId) : null,
          nationalityIds: form.nationalityIds,
          profileImageUrl: null,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) throw new Error('Failed to create person.');
      const created = await res.json();

      // 2. Upload image if one was selected
      if (imageFile && created.id) {
        const formData = new FormData();
        formData.append('image', imageFile);
        // Fire and forget — don't block on image upload failure
        fetch(`/api/persons/${created.id}/image`, {
          method: 'POST',
          body: formData,
        }).catch(() => {
          // Image upload failed silently; person is still created
        });
      }

      handleClose();
      onSuccess?.();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>Add Person</h2>
          <button onClick={handleClose} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
        </div>

        {loadingLookups ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '13px', color: '#6b7280' }}>Loading form options...</div>
        ) : (
          <>
            {/* Avatar picker */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  onClick={handleImageClick}
                  onMouseEnter={() => setAvatarHovered(true)}
                  onMouseLeave={() => setAvatarHovered(false)}
                  title="Click to add photo"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `1.5px ${imagePreview || avatarHovered ? 'solid #9B1C1C' : 'dashed #d1d5db'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#f3e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : previewInitials ? (
                    <span style={{ fontSize: '18px', color: '#9B1C1C', fontWeight: 500 }}>{previewInitials}</span>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}

                  {/* Hover overlay */}
                  {avatarHovered && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {imageFile ? imageFile.name : 'Add photo (optional)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* First + Last Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: '#9B1C1C' }}>*</span></label>
                <input type="text" placeholder="e.g. Maria" style={inputStyle} value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: '#9B1C1C' }}>*</span></label>
                <input type="text" placeholder="e.g. Callas" style={inputStyle} value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>

            {/* Middle Name */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Middle Name</label>
              <input type="text" placeholder="e.g. Anna" style={inputStyle} value={form.middleName} onChange={set('middleName')} />
            </div>

            {/* Email */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="e.g. maria@example.com" style={inputStyle} value={form.email} onChange={set('email')} />
            </div>

            {/* Voice Type */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Voice Type</label>
              <select style={selectStyle} value={form.voiceTypeId} onChange={set('voiceTypeId')}>
                <option value="">Select voice type</option>
                {voiceTypes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            {/* Nationalities */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Nationality</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {nationalities.map(n => {
                  const selected = form.nationalityIds.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleNationality(n.id)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: selected ? '1px solid #9B1C1C' : '1px solid #e5e7eb',
                        background: selected ? '#fef2f2' : '#fff',
                        color: selected ? '#9B1C1C' : '#6b7280',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                Currently active with Calgary Opera
              </label>
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
                <button onClick={handleClose} disabled={submitting} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting} style={{ fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: submitting ? '#c85a5a' : '#9B1C1C', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  {submitting ? 'Saving...' : 'Add Person'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddPersonModal;