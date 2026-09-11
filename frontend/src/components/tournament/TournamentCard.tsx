// frontend/src/components/tournament/TournamentCard.tsx
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ArrowUpRight, Zap, Target } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import type { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
  variant?: "default" | "compact" | "featured";
}

export const TournamentCard = ({ tournament, variant = "default" }: TournamentCardProps) => {
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";

  const statusColor =
    tournament.status === "REGISTRATION"
      ? "#4CAF50"
      : tournament.status === "GROUP_STAGE"
        ? "#FF9800"
          : tournament.status === "COMPLETED"
            ? "#64B5F6"
            : "#9C27B0";

  return (
    <Link
      to={`/tournaments/${tournament._id}`}
      className={`tournament-card ${isCompact ? "compact" : ""} ${isFeatured ? "featured" : ""}`}
      style={{ "--status-color": statusColor } as React.CSSProperties}
    >
      {/* Glow effect */}
      <div className="tc-glow" />

      {/* Status strip */}
      <div className="tc-status-strip" />

      <div className="tc-header">
        <StatusBadge status={tournament.status} size={isCompact ? "sm" : "md"} />
        <div className="tc-participants">
          <Users size={14} />
          <span>{tournament.participantCount || 0}</span>
        </div>
      </div>

      <div className="tc-body">
        <h3 className="tc-title">{tournament.name}</h3>

        {!isCompact && tournament.description && (
          <p className="tc-description">{tournament.description}</p>
        )}
      </div>

      <div className="tc-meta">
        <div className="tc-meta-item">
          <Calendar size={14} />
          <span>
            {tournament.tournamentStart
              ? new Date(tournament.tournamentStart).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "TBD"}
          </span>
        </div>
        <div className="tc-meta-item">
          <Trophy size={14} />
          <span>{tournament.maxParticipants || 20} slots</span>
        </div>
        {tournament.currentStage && (
          <div className="tc-meta-item tc-stage">
            <Zap size={14} />
            <span>{tournament.currentStage.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      {/* Progress bar for slots */}
      <div className="tc-progress">
        <div
          className="tc-progress-fill"
          style={{
            width: `${Math.min(
              100,
              ((tournament.participantCount || 0) / (tournament.maxParticipants || 20)) * 100,
            )}%`,
          }}
        />
      </div>

      {/* Hover arrow */}
      <div className="tc-arrow">
        <ArrowUpRight size={18} />
      </div>

      <style>{`
        .tournament-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          isolation: isolate;
        }

        .tournament-card.compact {
          padding: 18px;
          gap: 12px;
          border-radius: 16px;
        }

        .tournament-card.featured {
          padding: 28px;
          border-color: rgba(255, 215, 0, 0.15);
        }

        .tournament-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(41, 121, 255, 0.06),
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        .tournament-card:hover::before {
          opacity: 1;
        }

        .tournament-card:hover {
          transform: translateY(-6px);
          border-color: rgba(41, 121, 255, 0.25);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(41, 121, 255, 0.06);
          background: rgba(255, 255, 255, 0.03);
        }

        .tc-glow {
          position: absolute;
          top: -50%;
          right: -30%;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: var(--status-color, #2979FF);
          opacity: 0;
          filter: blur(80px);
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        .tournament-card:hover .tc-glow {
          opacity: 0.08;
        }

        .tc-status-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--status-color, #2979FF), transparent);
          opacity: 0.6;
        }

        .tc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .tc-participants {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .tc-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .tc-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .compact .tc-title {
          font-size: 16px;
        }

        .featured .tc-title {
          font-size: 22px;
        }

        .tc-description {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tc-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          position: relative;
          z-index: 1;
        }

        .tc-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tc-meta-item svg {
          opacity: 0.6;
        }

        .tc-stage {
          color: var(--status-color, #64B5F6);
          font-weight: 600;
          text-transform: capitalize;
        }

        .tc-progress {
          height: 3px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 100px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .tc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--status-color, #2979FF), #64B5F6);
          border-radius: 100px;
          transition: width 0.6s ease;
          box-shadow: 0 0 12px var(--status-color, #2979FF);
        }

        .tc-arrow {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          opacity: 0;
          transform: translate(-8px, 8px);
          transition: all 0.3s ease;
          z-index: 1;
        }

        .tournament-card:hover .tc-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        .compact .tc-arrow {
          width: 30px;
          height: 30px;
          bottom: 14px;
          right: 14px;
        }

        /* Track mouse for glow effect */
        .tournament-card {
          --mouse-x: 50%;
          --mouse-y: 50%;
        }
      `}</style>
    </Link>
  );
};

export default TournamentCard;
