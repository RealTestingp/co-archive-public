import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  children: ReactNode;
}

/* Overline label above a content block.
   --fs-xs / semibold / uppercase, in the 30% ink-muted tone.
   Was a hardcoded 11px + #9ca3af, which broke in dark mode. */
const SectionTitle = ({ children }: Props) => {
  const { colors, type, weight } = useTheme();

  return (
    <div
      style={{
        fontSize: type.xs,
        fontWeight: weight.semibold,
        textTransform: "uppercase",
        letterSpacing: "var(--ls-wide)",
        color: colors.inkMuted,
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );
};

export default SectionTitle;