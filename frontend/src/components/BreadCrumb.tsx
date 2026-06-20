import { Link } from 'react-router-dom';

interface Props {
  path: { label: string; to: string }[];
  current: string;
}

const BreadCrumb = ({ path, current }: Props) => (
  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1.5rem' }}>
    {path.map((item, i) => (
      <span key={i}>
        <Link to={item.to} style={{ color: '#9ca3af', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#111')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          {item.label}
        </Link>
        {' / '}
      </span>
    ))}
    <span style={{ color: '#9B1C1C', fontWeight: 500 }}>{current}</span>
  </div>
);

export default BreadCrumb;