interface Detail {
  label: string;
  value: string;
}

interface Props {
  details: Detail[];
}

const DetailRow = ({ details }: Props) => (
  <div
    style={{
      display: "flex",
      gap: "2rem",
      marginBottom: "1rem",
      flexWrap: "wrap",
    }}
  >
    {details.map((item) => (
      <div key={item.label}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9ca3af",
            marginBottom: "3px",
          }}
        >
          {item.label}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

export default DetailRow;
