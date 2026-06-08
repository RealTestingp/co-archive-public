interface Props {
  path: string[];
  current: string;
}

const BreadCrumb = ({ path, current }: Props) => (
  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1.5rem' }}>
    {path.join(' / ')} / <span style={{ color: '#9B1C1C', fontWeight: 500 }}>{current}</span>
  </div>
);

export default BreadCrumb;