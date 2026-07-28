/* ErrorState.tsx
   Shown in place of content when a fetch fails.

   The point is that a failed request produces something deliberate rather than
   a blank page. A user who sees nothing assumes the archive is empty; a user who
   sees this knows something went wrong and that retrying is worth a try.

   onRetry is optional, so the retry button only appears where the caller can
   actually retry. Offering a button that does nothing is worse than not
   offering one.

   FIXED: colours were hardcoded, so the "Error" label used the light mode red
   (too low contrast on a dark page) and the message text stayed mid grey. Now
   uses var(--c-brand-text) for the label, which is a lighter red in dark mode
   for exactly this reason, and var(--c-ink-muted) for the body.
*/
interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  message = "Something went wrong. Please try again.",
  onRetry,
}: Props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--c-brand-text)",
          marginBottom: "0.5rem",
        }}
      >
        Error
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "var(--c-ink-muted)",
          marginBottom: "1.5rem",
          maxWidth: "320px",
          lineHeight: 1.75,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            border: "1px solid var(--c-brand)",
            background: "var(--c-brand)",
            color: "var(--c-brand-on)",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
