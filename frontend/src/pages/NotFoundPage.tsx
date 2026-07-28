/* NotFoundPage.tsx
   The 404. Matched by the catch-all route at the bottom of App.tsx, so anything
   that does not match a real route lands here.

   Keeps the NavBar, so a wrong URL is a dead end with a way out rather than a
   blank page. That matters more than usual here because the archive is full of
   id based URLs that are easy to mistype or to follow after a record is
   removed.

   FIXED: every colour was hardcoded light, so this page rendered white with
   near black text even in dark mode, with the navbar above it correctly dark.
   Now uses the same CSS variables as the rest of the app, so it follows
   [data-theme] like everything else.
*/
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

const NotFoundPage = () => {
  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--c-ink)' }}>
      <NavBar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', textAlign: 'center', padding: '2rem', paddingBottom: '12rem' }}>

        {/* brand-text rather than brand: this is red TEXT, and the solid brand
            red does not have enough contrast on a dark background. */}
        <div style={{ fontSize: '72px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-brand-text)', marginBottom: '1rem', lineHeight: 1 }}>
          404
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--c-ink)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--c-ink-muted)', marginBottom: '2rem', maxWidth: '360px', lineHeight: 1.75 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Solid fill, so brand + brand-on is the correct pairing here. */}
        <Link
          to="/"
          style={{ fontSize: '12px', fontWeight: 500, padding: '8px 18px', borderRadius: '6px', background: 'var(--c-brand)', color: 'var(--c-brand-on)', textDecoration: 'none', border: '1px solid var(--c-brand)' }}
        >
          Back to Archive
        </Link>

      </div>
    </div>
  );
};

export default NotFoundPage;
