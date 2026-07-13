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
          "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
};

export default LoadingSkeleton;
