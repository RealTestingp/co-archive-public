import { Link } from 'react-router-dom';
const Navbar = () => {
  return (
    <nav style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 2rem', height: '52px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
        CALGARY OPERA <span style={{ color: '#9B1C1C' }}>ARCHIVE</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '1.75rem', fontSize: '12px', color: '#6b7280' }}>
          <Link to="/search" style={{ color: '#6b7280', textDecoration: 'none' }}>Search</Link>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Dashboard</a>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Reports</a>
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

export default Navbar;