import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

const NotFoundPage = () => {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111' }}>

      <NavBar />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', textAlign: 'center', padding: '2rem', paddingBottom: '12rem' }}>

        <div style={{ fontSize: '72px', fontWeight: 600, letterSpacing: '-0.02em', color: '#9B1C1C', marginBottom: '1rem', lineHeight: 1 }}>
          404
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '2rem', maxWidth: '360px', lineHeight: 1.75 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          style={{ fontSize: '12px', fontWeight: 500, padding: '8px 18px', borderRadius: '6px', background: '#9B1C1C', color: '#fff', textDecoration: 'none', border: '1px solid #9B1C1C' }}
        >
          Back to Archive
        </Link>

      </div>
    </div>
  );
};

export default NotFoundPage;