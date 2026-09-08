// frontend/src/components/common/StatusBadge.tsx
import type { TournamentStatus, ParticipantStatus, RegistrationStatus } from "../../types";

interface StatusBadgeProps {
  status: string | TournamentStatus | ParticipantStatus | RegistrationStatus;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge = ({ status, size = "md", className = "" }: StatusBadgeProps) => {
  const getTone = (): string => {
    const s = String(status).toUpperCase();
    if (s === "COMPLETED" || s === "CHAMPION" || s === "APPROVED") return "gold";
    if (s === "REGISTRATION" || s === "ADVANCED" || s === "ACCEPTED") return "blue";
    if (s === "GROUP_STAGE" || s === "ACTIVE") return "green";
    if (s === "QUARTER_FINAL" || s === "LIVE" || s === "ONGOING") return "orange";
    if (s === "SEMI_FINAL") return "purple";
    if (s === "FINAL") return "pink";
    if (s === "PENDING" || s === "UPCOMING") return "muted";
    if (s === "REJECTED" || s === "ELIMINATED" || s === "CANCELLED" || s === "DECLINED")
      return "red";
    if (s === "FINISHED") return "green";
    return "muted";
  };

  const getLabel = (): string => {
    const s = String(status);
    if (s === "GROUP_STAGE") return "Group Stage";
    if (s === "QUARTER_FINAL") return "Quarter Final";
    if (s === "SEMI_FINAL") return "Semi Final";
    if (s === "REGISTRATION") return "Registration";
    if (s === "COMPLETED") return "Completed";
    if (s === "CANCELLED") return "Cancelled";
    return s;
  };

  const sizeClass = size === "sm" ? "badge-sm" : "";

  return <span className={`badge ${getTone()} ${sizeClass} ${className}`}>{getLabel()}</span>;
};

export default StatusBadge;
