import React, { useState } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  style,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // ---- Variant style maps ----
  const variantStyles = {
    primary: {
      background: isHovered
        ? "linear-gradient(135deg, #1565C0, #0D47A1)"
        : "linear-gradient(135deg, #2979FF, #1565C0)",
      color: "#FFFFFF",
      border: "none",
    },
    secondary: {
      background: isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
      color: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.15)",
    },
    danger: {
      background: isHovered
        ? "linear-gradient(135deg, #C62828, #B71C1C)"
        : "linear-gradient(135deg, #F44336, #D32F2F)",
      color: "#FFFFFF",
      border: "none",
    },
    success: {
      background: isHovered
        ? "linear-gradient(135deg, #2E7D32, #1B5E20)"
        : "linear-gradient(135deg, #4CAF50, #388E3C)",
      color: "#FFFFFF",
      border: "none",
    },
  };

  // ---- Size style maps ----
  const sizeStyles = {
    sm: { padding: "6px 12px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "15px" },
    lg: { padding: "14px 28px", fontSize: "17px" },
  };

  // ---- Common button styles ----
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all 0.2s ease",
    outline: "none",
    ...(isActive && { transform: "scale(0.97)" }),
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style, // allow custom overrides
  };

  // ---- Render ----
  return (
    <button
      style={baseStyles}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: `2px solid ${variant === "secondary" ? "#64B5F6" : "#FFFFFF"}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          {typeof children === "string" ? children : "Loading..."}
        </>
      ) : (
        children
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
