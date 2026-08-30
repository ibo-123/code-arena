import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = "", style }) => {
  return (
    <div
      className={`${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "16px",
        padding: "24px",
        // Keep any custom styles passed via the `style` prop
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
