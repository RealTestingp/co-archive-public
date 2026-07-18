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
          color: "#9B1C1C",
          marginBottom: "0.5rem",
        }}
      >
        Error
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "#9ca3af",
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
            border: "1px solid #9B1C1C",
            background: "#9B1C1C",
            color: "#fff",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
