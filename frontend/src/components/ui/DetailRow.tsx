import { useTheme } from "../../context/ThemeContext";

interface Detail {
  label: string;
  value: string;
}

interface Props {
  details: Detail[];
}

/* Label/value pairs shown under a page header.
   Label = --fs-xs semibold uppercase (ink-muted).
   Value = --fs-sm semibold (ink).
   Previously 10px + hardcoded #111111, so values were invisible in dark mode.
   Gap tightens on narrow screens via clamp() rather than a media query,
   because this component is styled inline. */
const DetailRow = ({ details }: Props) => {
  const { colors, type, weight } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(1rem, 5vw, 2rem)",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      {details.map((item) => (
        <div key={item.label} style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: type.xs,
              fontWeight: weight.semibold,
              textTransform: "uppercase",
              letterSpacing: "var(--ls-wide)",
              color: colors.inkMuted,
              marginBottom: "3px",
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: type.sm,
              fontWeight: weight.semibold,
              color: colors.ink,
              overflowWrap: "break-word",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetailRow;