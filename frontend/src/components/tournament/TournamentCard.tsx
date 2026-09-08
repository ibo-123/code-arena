// frontend/src/components/tournament/TournamentCard.tsx
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import type { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
  variant?: "default" | "compact";
}

export const TournamentCard = ({ tournament, variant = "default" }: TournamentCardProps) => {
  const isCompact = variant === "compact";

  return (
    <Link
      to={`/tournaments/${tournament._id}`}
      className="tournament-card"
      style={{
        padding: isCompact ? "16px" : "24px",
      }}
    >
      <div className="card-header">
        <StatusBadge status={tournament.status} size={isCompact ? "sm" : "md"} />
        <span className="participant-count">
          <Users size={14} />
          {tournament.participantCount || 0}
        </span>
      </div>

      <h3 style={{ fontSize: isCompact ? "16px" : "20px" }}>{tournament.name}</h3>

      {!isCompact && tournament.description && (
        <p className="card-description">{tournament.description}</p>
      )}

      <div className="card-footer">
        <span>
          <Calendar size={14} />
          {tournament.tournamentStart
            ? new Date(tournament.tournamentStart).toLocaleDateString()
            : "TBD"}
        </span>
        <span>
          <Trophy size={14} />
          {tournament.maxParticipants || 20} slots
        </span>
        {tournament.currentStage && (
          <span className="stage-badge">{tournament.currentStage.replace("_", " ")}</span>
        )}
      </div>
    </Link>
  );
};

export default TournamentCard;
