import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
  variant?: "default" | "glass" | "dark" | "glow";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  style,
  hoverable = true,
  variant = "glass",
  padding = "md",
  onClick,
}) => {
  const variantStyles = {
    glass: {
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    },
    dark: {
      background: "rgba(15, 16, 26, 0.9)",
      border: "1px solid rgba(255, 255, 255, 0.04)",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
    },
    default: {
      background: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    },
    glow: {
      background: "rgba(41, 121, 255, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(41, 121, 255, 0.08)",
      boxShadow: "0 4px 32px rgba(41, 121, 255, 0.08)",
    },
  };

  const paddingStyles = {
    none: { padding: 0 },
    sm: { padding: "12px" },
    md: { padding: "24px" },
    lg: { padding: "32px" },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    cursor: onClick ? "pointer" : "default",
    ...variantStyles[variant],
    ...paddingStyles[padding],
  };

  const hoverStyles: React.CSSProperties = hoverable
    ? {
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }
    : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...hoverStyles,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = "rgba(41, 121, 255, 0.2)";
          e.currentTarget.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor =
            variantStyles[variant].border || "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.boxShadow =
            variantStyles[variant].boxShadow || "0 4px 24px rgba(0, 0, 0, 0.2)";
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;
