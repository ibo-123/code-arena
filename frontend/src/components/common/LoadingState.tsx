// frontend/src/components/common/LoadingState.tsx
import React from "react";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading...",
  size = "md",
}) => {
  const containerSize =
    {
      sm: 32,
      md: 48,
      lg: 64,
    }[size] || 48;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        gap: "16px",
        minHeight: "120px",
      }}
    >
      <div
        style={{
          width: containerSize,
          height: containerSize,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `3px solid rgba(41,121,255,0.1)`,
            borderTop: `3px solid #2979FF`,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "12px",
            borderRadius: "50%",
            border: `3px solid rgba(156,39,176,0.1)`,
            borderBottom: `3px solid #9C27B0`,
            animation: "spin 1.2s linear infinite reverse",
          }}
        />
      </div>
      {label && (
        <div
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            fontWeight: "500",
          }}
        >
          {label}
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
