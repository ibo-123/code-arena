import { Link } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import type { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  return (
    <Link to={`/tournaments/${tournament._id}`} className="tournament-card">
      <div className="card-header">
        <StatusBadge status={tournament.status} />
        <span className="participant-count">
          <Users size={14} />
          {tournament.participantCount || 0}
        </span>
      </div>

      <h3>{tournament.name}</h3>
      <p className="card-description">{tournament.description}</p>

      <div className="card-footer">
        <span>
          <Calendar size={14} />{" "}
          {tournament.tournamentStart
            ? new Date(tournament.tournamentStart).toLocaleDateString()
            : "TBD"}
        </span>
        <span>
          <Trophy size={14} /> {tournament.maxParticipants || 20} slots
        </span>
      </div>
    </Link>
  );
};
