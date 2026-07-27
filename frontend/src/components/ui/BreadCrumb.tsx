import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  path: { label: string; to: string }[];
  current: string;
}

/* Breadcrumb trail.
   --fs-xs throughout. Trail links are ink-muted (30%); the current crumb is
   full ink + semibold. No brand red here — breadcrumbs are structure, and
   spending the 10% budget on them is what pushes red over its share.
   Wraps on narrow screens instead of forcing horizontal overflow. */
const BreadCrumb = ({ path, current }: Props) => {
  const navigate = useNavigate();
  const { colors, type, weight } = useTheme();

  const restColor = colors.inkMuted;
  const hoverColor = colors.ink;

  return (
    <div
      style={{
        fontSize: type.xs,
        fontWeight: weight.regular,
        color: restColor,
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        rowGap: "2px",
      }}
    >
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
      <span style={{ color: colors.ink, fontWeight: weight.semibold }}>
        {current}
      </span>
    </div>
  );
};

export default BreadCrumb;