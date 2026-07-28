import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

/* ============================================================================
   PROGRAM PDF PREVIEW

   Mirrors the profile-photo thumbnail on PersonPage: a small, page-shaped
   preview to the left of the header that opens the full document in a new tab.

   The preview is a scaled <iframe> of the real PDF rather than an icon — the
   browser's built-in viewer renders page 1, so there's no pdf.js dependency.
   Two things make it behave like an image instead of an embedded app:

     • pointerEvents: "none" on the iframe, so clicks and scrolls pass through
       to the anchor wrapping it.
     • #toolbar=0&navpanes=0&scrollbar=0&view=FitH, which strips the viewer
       chrome and fits the page to the thumbnail width.

   CAVEAT: this only renders if the blob is served inline. If Azure sends
   Content-Disposition: attachment the frame comes up empty — the card, label
   and hover state still read correctly, but check against a real production
   before demoing.
   ========================================================================== */

interface Props {
  /** URL to the program PDF. Renders nothing when null. */
  url: string | null;
  /** Production title — used for the accessible label only. */
  title?: string;
  /** Thumbnail width in px; height follows US Letter proportions. */
  width?: number;
}

const LETTER_RATIO = 11 / 8.5;

const ProgramPdfPreview = ({ url, title, width = 76 }: Props) => {
  const { colors, type, weight } = useTheme();
  const [active, setActive] = useState(false);

  if (!url) return null;

  const height = Math.round(width * LETTER_RATIO);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        flexShrink: 0,
      }}
    >
      <a href={url} target="_blank" rel="noreferrer"
        aria-label={title ? `Open program PDF for ${title}` : "Open program PDF"}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        style={{
          position: "relative",
          display: "block",
          width: `${width}px`,
          height: `${height}px`,
          overflow: "hidden",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${active ? colors.brand : colors.border}`,
          background: colors.surface,
          boxShadow: active ? "var(--shadow-overlay)" : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          textDecoration: "none",
        }}
      >
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1`}
          title="Program preview"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            pointerEvents: "none",
            background: colors.surface,
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "6px 4px",
            fontSize: type.xs,
            fontWeight: weight.semibold,
            color: "#ffffff",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0) 55%)",
            opacity: active ? 1 : 0,
            transition: "opacity 0.15s ease",
            pointerEvents: "none",
          }}
        >
          Open
        </span>
      </a>

      <span
        style={{
          fontSize: type.xs,
          fontWeight: weight.regular,
          color: colors.inkMuted,
          whiteSpace: "nowrap",
        }}
      >
        Program
      </span>
    </div>
  );
};

export default ProgramPdfPreview;