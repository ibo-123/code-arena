import React from "react";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { tokens } from "../../styles/designTokens";

// ---------- Page Header ----------
interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) => (
  <header
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: tokens.spacing.xl,
      flexWrap: "wrap",
      gap: tokens.spacing.md,
    }}
  >
    <div>
      <small
        style={{
          fontSize: "11px",
          color: tokens.colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </small>
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 36px)",
          fontWeight: 700,
          margin: "4px 0 0 0",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: "14px",
            color: tokens.colors.text.muted,
            marginTop: "4px",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {actions}
      </div>
    )}
  </header>
);

// ---------- Buttons ----------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  icon,
  loading,
  children,
  style,
  disabled,
  ...props
}) => {
  const sizeStyles: Record<NonNullable<ButtonProps["size"]>, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "8px 16px", fontSize: "13px" },
    lg: { padding: "12px 24px", fontSize: "14px" },
  };

  const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
    primary: {
      background: tokens.gradients.brand,
      border: "none",
      color: "white",
    },
    secondary: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.medium}`,
      color: tokens.colors.text.secondary,
    },
    ghost: {
      background: "transparent",
      border: "none",
      color: tokens.colors.text.secondary,
    },
    danger: {
      background: "rgba(244,67,54,0.1)",
      border: "1px solid rgba(244,67,54,0.2)",
      color: tokens.colors.accent.red,
    },
    success: {
      background: "rgba(76,175,80,0.15)",
      border: "1px solid rgba(76,175,80,0.3)",
      color: tokens.colors.accent.green,
    },
    gold: {
      background: tokens.gradients.gold,
      border: "none",
      color: "#0a0e17",
    },
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: tokens.radius.md,
        fontWeight: 600,
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "all 0.2s ease",
        opacity: isDisabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {loading ? (
        <>
          <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
          Loading...
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

// ---------- Alert ----------
interface AlertProps {
  type: "error" | "success" | "info" | "warning";
  message: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
  const config = {
    error: { color: tokens.colors.accent.red, bg: "rgba(244,67,54,0.1)", Icon: AlertCircle },
    success: { color: tokens.colors.accent.green, bg: "rgba(76,175,80,0.1)", Icon: CheckCircle },
    info: { color: tokens.colors.accent.blueLight, bg: "rgba(41,121,255,0.1)", Icon: AlertCircle },
    warning: { color: tokens.colors.accent.orange, bg: "rgba(255,152,0,0.1)", Icon: AlertCircle },
  }[type];

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: tokens.radius.md,
        background: config.bg,
        border: `1px solid ${config.color}33`,
        color: config.color,
        fontSize: "13px",
        marginBottom: tokens.spacing.md,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <config.Icon size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: config.color,
            cursor: "pointer",
            padding: 0,
            opacity: 0.7,
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// ---------- Card ----------
interface AdminCardProps {
  children: React.ReactNode;
  padding?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: "default" | "gold" | "blue" | "danger";
  style?: React.CSSProperties;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  padding = "20px",
  onClick,
  hoverable,
  variant = "default",
  style,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const variantStyles: Record<NonNullable<AdminCardProps["variant"]>, React.CSSProperties> = {
    default: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
    },
    gold: {
      background: "rgba(255,215,0,0.03)",
      border: "1px solid rgba(255,215,0,0.1)",
    },
    blue: {
      background: "rgba(41,121,255,0.03)",
      border: "1px solid rgba(41,121,255,0.08)",
    },
    danger: {
      background: "rgba(244,67,54,0.03)",
      border: "1px solid rgba(244,67,54,0.1)",
    },
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        ...variantStyles[variant],
        borderRadius: tokens.radius.lg,
        padding,
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : undefined,
        ...(hoverable && hovered
          ? {
              background: tokens.colors.bg.cardHover,
              borderColor: tokens.colors.border.focus,
              transform: "translateY(-2px)",
              boxShadow: tokens.shadows.cardHover,
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- Collapsible Section ----------
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: "default" | "gold" | "purple" | "blue";
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  expanded,
  onToggle,
  children,
  variant = "default",
}) => {
  const variantStyles: Record<
    NonNullable<CollapsibleSectionProps["variant"]>,
    React.CSSProperties
  > = {
    default: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
    },
    gold: {
      background: "rgba(255,215,0,0.03)",
      border: "1px solid rgba(255,215,0,0.1)",
    },
    purple: {
      background: "rgba(156,39,176,0.03)",
      border: "1px solid rgba(156,39,176,0.1)",
    },
    blue: {
      background: "rgba(41,121,255,0.03)",
      border: "1px solid rgba(41,121,255,0.08)",
    },
  };

  return (
    <div
      style={{
        ...variantStyles[variant],
        borderRadius: tokens.radius.lg,
        padding: "20px",
        marginBottom: tokens.spacing.lg,
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "4px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {icon}
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{title}</h3>
          {badge}
        </div>
        <span style={{ color: tokens.colors.text.muted, fontSize: "18px" }}>
          {expanded ? "−" : "+"}
        </span>
      </div>
      {expanded && <div style={{ marginTop: tokens.spacing.md }}>{children}</div>}
    </div>
  );
};

// ---------- Empty State ----------
interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <AdminCard padding="60px 24px" style={{ textAlign: "center", borderStyle: "dashed" }}>
    <div
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: "rgba(41,121,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
      }}
    >
      {icon}
    </div>
    <h3 style={{ margin: "0 0 8px 0", color: tokens.colors.text.primary, fontSize: "18px" }}>
      {title}
    </h3>
    <p style={{ color: tokens.colors.text.muted, marginBottom: "20px", fontSize: "14px" }}>
      {description}
    </p>
    {action}
  </AdminCard>
);

// ---------- Stat Card ----------
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgColor, subtitle }) => (
  <AdminCard
    padding="18px 22px"
    hoverable
    style={{ display: "flex", alignItems: "center", gap: "14px" }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: tokens.radius.lg,
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: "11px",
          color: tokens.colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: tokens.colors.text.primary,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "11px", color: tokens.colors.text.muted, marginTop: "2px" }}>
          {subtitle}
        </div>
      )}
    </div>
  </AdminCard>
);

// ---------- Shared Styles ----------
export const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${tokens.colors.border.focus} !important;
    box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
    outline: none !important;
  }
`;

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: tokens.radius.md,
  background: tokens.colors.bg.input,
  border: `1px solid ${tokens.colors.border.medium}`,
  color: tokens.colors.text.primary,
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: tokens.colors.text.secondary,
  marginBottom: "6px",
  letterSpacing: "0.3px",
};
