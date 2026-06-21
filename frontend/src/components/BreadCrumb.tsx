import { Link, useNavigate } from 'react-router-dom';

interface Props {
  path: { label: string; to: string }[];
  current: string;
}

const BreadCrumb = ({ path, current }: Props) => {
  const navigate = useNavigate();

  return (
    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1.5rem' }}>
      {path.map((item, i) => {
        const isParent = i === path.length - 1;
        return (
          <span key={i}>
            {isParent ? (
              <span
                onClick={() => navigate(-1)}
                style={{ color: '#9ca3af', textDecoration: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
              >
                {item.label}
              </Link>
            )}
            {' / '}
          </span>
        );
      })}
      <span style={{ color: '#9B1C1C', fontWeight: 500 }}>{current}</span>
    </div>
  );
};

export default BreadCrumb;