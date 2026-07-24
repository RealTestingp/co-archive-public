import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  path: { label: string; to: string }[];
  current: string;
}

const BreadCrumb = ({ path, current }: Props) => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  // Current crumb is the primary ink colour (was red) — theme-aware so it's
  // visible in both light and dark.
  const currentColor = colors.textPrimary;
  const hoverColor = colors.textPrimary;
  const restColor = "#9ca3af";

  return (
    <div style={{ fontSize: "11px", color: restColor, marginBottom: "1.5rem" }}>
      {path.map((item, i) => {
        const isParent = i === path.length - 1;
        return (
          <span key={i}>
            {isParent ? (
              <span
                onClick={() => navigate(-1)}
                style={{
                  color: restColor,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = restColor)}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                style={{ color: restColor, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = restColor)}
              >
                {item.label}
              </Link>
            )}
            {" / "}
          </span>
        );
      })}
      <span style={{ color: currentColor, fontWeight: 500 }}>{current}</span>
    </div>
  );
};

export default BreadCrumb;