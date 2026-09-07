import type { TournamentStatus } from "../../types";

interface StatusBadgeProps {
  status: TournamentStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge = ({ status, size = "md" }: StatusBadgeProps) => {
  const getTone = () => {
    if (status === "COMPLETED") return "gold";
    if (status === "REGISTRATION") return "blue";
    if (status === "GROUP_STAGE") return "purple";
    if (status === "QUARTER_FINAL") return "orange";
    if (status === "SEMI_FINAL") return "pink";
    if (status === "FINAL") return "red";
    if (status === "LIVE") return "red";
    if (status === "FINISHED") return "green";
    if (status === "PENDING") return "muted";
    if (status === "APPROVED") return "green";
    if (status === "REJECTED") return "red";
    if (status === "ELIMINATED") return "muted";
    if (status === "ADVANCED") return "blue";
    if (status === "CHAMPION") return "gold";
    return "muted";
  };

  const getLabel = () => {
    if (status === "GROUP_STAGE") return "Group Stage";
    if (status === "QUARTER_FINAL") return "Quarter Final";
    if (status === "SEMI_FINAL") return "Semi Final";
    return status;
  };

  const sizeClass = size === "sm" ? "badge-sm" : "";

  return <span className={`badge ${getTone()} ${sizeClass}`}>{getLabel()}</span>;
};
