import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const SectionTitle = ({ children }: Props) => (
  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '10px' }}>
    {children}
  </div>
);

export default SectionTitle;