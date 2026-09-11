// frontend/src/components/common/LoadingState.tsx
import React from "react";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "skeleton" | "spinner" | "dots" | "pulse";
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading...",
  size = "md",
  variant = "skeleton",
  fullScreen = false,
}) => {
  const sizeMap = {
    sm: { container: 36, dot: 8, stroke: 2, font: 12, avatar: 32, gap: 12 },
    md: { container: 56, dot: 12, stroke: 3, font: 14, avatar: 48, gap: 16 },
    lg: { container: 80, dot: 16, stroke: 4, font: 16, avatar: 64, gap: 20 },
  };
  const s = sizeMap[size] || sizeMap.md;

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: fullScreen ? "0" : "48px 24px",
    gap: "20px",
    minHeight: fullScreen ? "100vh" : "160px",
    width: "100%",
    ...(fullScreen && {
      position: "fixed",
      inset: 0,
      background: "rgba(8, 10, 20, 0.95)",
      backdropFilter: "blur(20px)",
      zIndex: 9999,
    }),
  };

  // ---- Dots variant ----
  if (variant === "dots") {
    return (
      <div style={wrapperStyle}>
        <div style={{ display: "flex", gap: `${s.dot}px`, alignItems: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: `${s.dot}px`,
                height: `${s.dot}px`,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2979FF, #64B5F6)",
                boxShadow: "0 0 16px rgba(41, 121, 255, 0.5)",
                animation: `dotBounce 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        {label && (
          <div
            style={{
              fontSize: `${s.font}px`,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </div>
        )}
        <style>{`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
            40% { transform: scale(1) translateY(-8px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Pulse variant ----
  if (variant === "pulse") {
    return (
      <div style={wrapperStyle}>
        <div style={{ position: "relative", width: s.container, height: s.container }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(41, 121, 255, 0.15)",
              animation: "pulseRing 2s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(41, 121, 255, 0.1)",
              animation: "pulseRing 2s ease-out 0.5s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2979FF, #64B5F6)",
              boxShadow: "0 0 32px rgba(41, 121, 255, 0.6)",
            }}
          />
        </div>
        {label && (
          <div
            style={{
              fontSize: `${s.font}px`,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </div>
        )}
        <style>{`
          @keyframes pulseRing {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Spinner variant ----
  if (variant === "spinner") {
    return (
      <div style={wrapperStyle}>
        <div style={{ width: s.container, height: s.container, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${s.stroke}px solid rgba(41,121,255,0.08)`,
              borderTop: `${s.stroke}px solid #2979FF`,
              animation: "spin 0.9s linear infinite",
              boxShadow: "0 0 24px rgba(41, 121, 255, 0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${s.container * 0.2}px`,
              borderRadius: "50%",
              border: `${s.stroke}px solid rgba(156,39,176,0.08)`,
              borderBottom: `${s.stroke}px solid #9C27B0`,
              animation: "spin 1.4s linear infinite reverse",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${s.container * 0.4}px`,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2979FF, #64B5F6)",
              animation: "corePulse 1.2s ease-in-out infinite",
            }}
          />
        </div>
        {label && (
          <div
            style={{
              fontSize: `${s.font}px`,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
              letterSpacing: "0.5px",
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
          @keyframes corePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.85); opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Skeleton variant (default) ----
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: fullScreen ? "0" : "32px 24px",
        minHeight: fullScreen ? "100vh" : "160px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${s.gap}px`,
          padding: "24px 28px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.06)",
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.8s infinite",
            pointerEvents: "none",
          }}
        />

        {/* Avatar skeleton */}
        <div
          style={{
            width: `${s.avatar}px`,
            height: `${s.avatar}px`,
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(41,121,255,0.1), rgba(156,39,176,0.1))",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.8s infinite",
            }}
          />
        </div>

        {/* Text skeletons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {[
            { width: "75%", height: 16, opacity: 0.08 },
            { width: "55%", height: 12, opacity: 0.06 },
            { width: "35%", height: 10, opacity: 0.04 },
          ].map((bar, i) => (
            <div
              key={i}
              style={{
                height: `${bar.height}px`,
                width: bar.width,
                borderRadius: "8px",
                background: `rgba(255,255,255,${bar.opacity})`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.8s ${i * 0.2}s infinite`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Accent dot */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2979FF, #64B5F6)",
            boxShadow: "0 0 12px rgba(41, 121, 255, 0.5)",
            animation: "corePulse 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      </div>

      {label && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            fontSize: `${s.font}px`,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
