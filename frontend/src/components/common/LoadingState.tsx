// frontend/src/components/common/LoadingState.tsx
import React from "react";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "skeleton" | "spinner" | "dots" | "pulse";
  fullScreen?: boolean;
}

const sizeMap = {
  sm: { container: 36, dot: 8, stroke: 2, font: 12, avatar: 32, gap: 12, barH: 10 },
  md: { container: 56, dot: 12, stroke: 3, font: 14, avatar: 48, gap: 16, barH: 14 },
  lg: { container: 80, dot: 16, stroke: 4, font: 16, avatar: 64, gap: 20, barH: 18 },
};

const Colors = {
  blue: "#2979FF",
  blueLight: "#64B5F6",
  purple: "#9C27B0",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.4)",
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading...",
  size = "md",
  variant = "skeleton",
  fullScreen = false,
}) => {
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
      WebkitBackdropFilter: "blur(20px)",
      zIndex: 9999,
    }),
  };

  const labelStyle: React.CSSProperties = {
    fontSize: `${s.font}px`,
    color: Colors.textMuted,
    fontWeight: 600,
    letterSpacing: "0.4px",
  };

  // ---- Dots variant --------------------------------------------------
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
                background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
                boxShadow: `0 0 16px ${Colors.blue}80`,
                animation: `dotBounce 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        {label && <div style={labelStyle}>{label}</div>}
        <style>{`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
            40% { transform: scale(1) translateY(-8px); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            div[style*="dotBounce"] { animation: none !important; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Pulse variant -------------------------------------------------
  if (variant === "pulse") {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            position: "relative",
            width: s.container,
            height: s.container,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `${Colors.blue}26`,
              animation: "pulseRing 2s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `${Colors.blue}1a`,
              animation: "pulseRing 2s ease-out 0.5s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
              boxShadow: `0 0 32px ${Colors.blue}99`,
            }}
          />
        </div>
        {label && <div style={labelStyle}>{label}</div>}
        <style>{`
          @keyframes pulseRing {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            div[style*="pulseRing"] { animation: none !important; opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Spinner variant -----------------------------------------------
  if (variant === "spinner") {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            width: s.container,
            height: s.container,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${s.stroke}px solid ${Colors.blue}14`,
              borderTop: `${s.stroke}px solid ${Colors.blue}`,
              animation: "spin 0.9s linear infinite",
              boxShadow: `0 0 24px ${Colors.blue}33`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${s.container * 0.2}px`,
              borderRadius: "50%",
              border: `${s.stroke}px solid ${Colors.purple}14`,
              borderBottom: `${s.stroke}px solid ${Colors.purple}`,
              animation: "spin 1.4s linear infinite reverse",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${s.container * 0.4}px`,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
              animation: "corePulse 1.2s ease-in-out infinite",
            }}
          />
        </div>
        {label && <div style={labelStyle}>{label}</div>}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes corePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.85); opacity: 0.7; }
          }
          @media (prefers-reduced-motion: reduce) {
            div[style*="spin"] { animation: none !important; }
            div[style*="corePulse"] { animation: none !important; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Skeleton variant (default) ------------------------------------
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
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {/* Shimmer overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
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
            background: `linear-gradient(135deg, ${Colors.blue}1a, ${Colors.purple}1a)`,
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

        {/* Text bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {[
            { width: "75%", h: s.barH, op: 0.08 },
            { width: "55%", h: s.barH - 2, op: 0.06 },
            { width: "35%", h: s.barH - 4, op: 0.05 },
          ].map((bar, i) => (
            <div
              key={i}
              style={{
                height: `${bar.h}px`,
                width: bar.width,
                borderRadius: "8px",
                background: `rgba(255,255,255,${bar.op})`,
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
          aria-hidden="true"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
            boxShadow: `0 0 12px ${Colors.blue}80`,
            animation: "corePulse 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      </div>

      {label && (
        <div
          style={{
            fontSize: `${s.font}px`,
            color: Colors.textFaint,
            fontWeight: 600,
            letterSpacing: "0.4px",
            marginTop: "4px",
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
        @media (prefers-reduced-motion: reduce) {
          div[style*="shimmer"] { animation: none !important; }
          div[style*="corePulse"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
