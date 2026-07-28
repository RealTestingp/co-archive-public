import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useTheme } from "../context/ThemeContext";

/* ============================================================================
   PROGRAM PDF PREVIEW

   Renders page 1 of the program to a <canvas> with pdf.js, rather than handing
   the URL to an <iframe>. The iframe version delegated display to whatever PDF
   viewer the browser ships — Chrome, Edge and Firefox each drew their own
   toolbars and scrollbars, so the same production looked different on every
   machine. Drawing it ourselves makes the thumbnail byte-identical everywhere.

   pdf.js FETCHES the file, so unlike an iframe it is subject to CORS. If the
   program lives on a different origin (Azure Blob), that storage account needs
   the app's origin in its CORS allow-list, or the request fails and this falls
   back to the static card below. The fallback is deliberately presentable —
   a blocked PDF should look like a design choice, not a broken image.
   ========================================================================== */

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  /** URL to the program PDF. Renders nothing when null. */
  url: string | null;
  /** Production title — accessible label and fallback card caption. */
  title?: string;
  /** Thumbnail width in px; height follows US Letter proportions. */
  width?: number;
}

const LETTER_RATIO = 11 / 8.5;

const ProgramPdfPreview = ({ url, title, width = 76 }: Props) => {
  const { colors, type, weight } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [active, setActive] = useState(false);

  const height = Math.round(width * LETTER_RATIO);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    const task = pdfjsLib.getDocument({ url });

    const draw = async () => {
      setStatus("loading");
      try {
        const pdf = await task.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        // Render at device pixel ratio so the thumbnail isn't soft on retina
        // and on the projector, then let CSS scale it back down.
        const base = page.getViewport({ scale: 1 });
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: (width * dpr) / base.width });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    draw();

    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [url, width]);

  if (!url) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
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
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            opacity: status === "ready" ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        />

        {status !== "ready" && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "6px",
              background: colors.surface,
              color: colors.inkMuted,
              fontSize: type.xs,
              fontWeight: weight.semibold,
              textAlign: "center",
            }}
          >
            {status === "error" && (
              <span style={{ color: colors.brandText, letterSpacing: "var(--ls-wide)" }}>
                PDF
              </span>
            )}
          </span>
        )}

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
            background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0) 55%)",
            opacity: active ? 1 : 0,
            transition: "opacity 0.15s ease",
            pointerEvents: "none",
          }}
        >
          Open
        </span>
      </a>

      <span style={{ fontSize: type.xs, fontWeight: weight.regular, color: colors.inkMuted, whiteSpace: "nowrap" }}>
        Program
      </span>
    </div>
  );
};

export default ProgramPdfPreview;