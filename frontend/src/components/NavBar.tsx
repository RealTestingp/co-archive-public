import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const { pathname } = useLocation();

    const isActive = (path: string) =>
    pathname.startsWith(path) || (pathname === '/' && path === '/search');

    const linkStyle = (path: string) => ({
    color: isActive(path) ? '#9B1C1C' : '#6b7280',
    textDecoration: 'none',
    fontWeight: isActive(path) ? 600 : 400,
    });

  return (
    <nav style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 2rem', height: '52px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#111' }}>
          CALGARY OPERA <span style={{ color: '#9B1C1C' }}>ARCHIVE</span>
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '1.75rem', fontSize: '12px' }}>
          <Link to="/search" style={linkStyle('/search')}>Search</Link>
          <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
          <Link to="/reports" style={linkStyle('/reports')}>Reports</Link>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: '#111', color: '#fff', fontSize: '11px', fontWeight: 500, padding: '5px 12px', borderRadius: '4px' }}>
          Admin
        </div>
      </div>
    </nav>
  );
};

export default NavBar;