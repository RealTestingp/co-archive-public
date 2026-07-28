/* Divider.tsx
   A horizontal rule between sections, with the spacing already built in so
   pages do not each invent their own margins.

   FIXED: was hardcoded to #f3f4f6, a light grey, so the divider stayed light on
   a dark background. Now reads var(--c-border), the same token the rest of the
   app uses, so it follows [data-theme] automatically.

   Using the CSS variable directly rather than useTheme on purpose: it needs no
   hook, no context, and no re-render on theme change. The browser resolves it.
*/
const Divider = () => (
  <div
    style={{ height: "1px", background: "var(--c-border)", margin: "1rem 0" }}
  />
);

export default Divider;
