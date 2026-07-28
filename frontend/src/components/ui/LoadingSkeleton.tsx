/* LoadingSkeleton.tsx
   Grey placeholder block shown while data loads.

   A skeleton rather than a spinner because it holds the shape of the content
   that is coming, so the page does not jump when the data lands. Callers pass
   the size, which is what lets one component stand in for a title, a row or a
   whole card.

   The shimmer is a gradient twice the width of the element, animated across it
   by the `shimmer` keyframes in the global stylesheet. It suggests progress
   without needing to know how much is left.

   FIXED: the gradient was hardcoded light greys, so skeletons glared white in
   dark mode. Now built from var(--c-surface-hover) and var(--c-border), which
   both flip with the theme, so the shimmer stays a shade above the background
   either way.
*/
interface Props {
  width?: string;
  height?: string;
  borderRadius?: string;
}

const LoadingSkeleton = ({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
}: Props) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, var(--c-surface-hover) 25%, var(--c-border) 50%, var(--c-surface-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
};

export default LoadingSkeleton;
