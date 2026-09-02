import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "blue" | "gold" | "green" | "red" | "muted" | "purple" | "pink" | "orange";
  className?: string;
  style?: React.CSSProperties;
  glowing?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = "blue",
  className = "",
  style,
  glowing = false,
  size = "md",
  icon,
}) => {
  const toneStyles = {
    blue: {
      bg: "rgba(41, 121, 255, 0.12)",
      text: "#64B5F6",
      border: "rgba(41, 121, 255, 0.2)",
      glow: "0 0 20px rgba(41, 121, 255, 0.15)",
    },
    gold: {
      bg: "rgba(255, 215, 0, 0.12)",
      text: "#FFD700",
      border: "rgba(255, 215, 0, 0.2)",
      glow: "0 0 20px rgba(255, 215, 0, 0.15)",
    },
    green: {
      bg: "rgba(0, 230, 118, 0.12)",
      text: "#00E676",
      border: "rgba(0, 230, 118, 0.2)",
      glow: "0 0 20px rgba(0, 230, 118, 0.15)",
    },
    red: {
      bg: "rgba(255, 23, 68, 0.12)",
      text: "#FF6B6B",
      border: "rgba(255, 23, 68, 0.2)",
      glow: "0 0 20px rgba(255, 23, 68, 0.15)",
    },
    muted: {
      bg: "rgba(255, 255, 255, 0.05)",
      text: "#9EAFCE",
      border: "rgba(255, 255, 255, 0.08)",
      glow: "none",
    },
    purple: {
      bg: "rgba(156, 39, 176, 0.12)",
      text: "#CE93D8",
      border: "rgba(156, 39, 176, 0.2)",
      glow: "0 0 20px rgba(156, 39, 176, 0.15)",
    },
    pink: {
      bg: "rgba(233, 30, 99, 0.12)",
      text: "#F06292",
      border: "rgba(233, 30, 99, 0.2)",
      glow: "0 0 20px rgba(233, 30, 99, 0.15)",
    },
    orange: {
      bg: "rgba(255, 152, 0, 0.12)",
      text: "#FFA726",
      border: "rgba(255, 152, 0, 0.2)",
      glow: "0 0 20px rgba(255, 152, 0, 0.15)",
    },
  };

  const sizeStyles = {
    sm: {
      padding: "2px 10px",
      fontSize: "10px",
      borderRadius: "12px",
      gap: "4px",
    },
    md: {
      padding: "4px 14px",
      fontSize: "12px",
      borderRadius: "100px",
      gap: "6px",
    },
    lg: {
      padding: "6px 18px",
      fontSize: "14px",
      borderRadius: "100px",
      gap: "8px",
    },
  };

  const styles = toneStyles[tone] || toneStyles.blue;

  return (
    <span
      className={`inline-flex items-center font-medium ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        boxShadow: glowing ? styles.glow : "none",
        transition: "all 0.3s ease",
        ...sizeStyles[size],
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
