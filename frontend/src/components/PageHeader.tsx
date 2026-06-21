interface Props {
  title: string;
  subtitle: string;
  onEdit?: () => void;
  onViewHistory?: () => void;
  editLabel?: string;
}

const PageHeader = ({ title, subtitle, onEdit, onViewHistory, editLabel = 'Edit' }: Props) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111111', letterSpacing: '-0.02em', marginBottom: '4px' }}>
        {title}
      </h1>
      <div style={{ fontSize: '13px', color: '#6b7280' }}>{subtitle}</div>
    </div>
    <div>
      <button
        onClick={onViewHistory}
        style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', marginLeft: '8px' }}
      >
        View History
      </button>
      <button
        onClick={onEdit}
        style={{ fontSize: '12px', fontWeight: 500, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #9B1C1C', background: '#9B1C1C', color: '#fff', marginLeft: '8px' }}
      >
        {editLabel}
      </button>
    </div>
  </div>
);

export default PageHeader;