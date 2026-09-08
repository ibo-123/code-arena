// frontend/src/pages/participant/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Medal, Star, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState } from "../../components/common";
import type { Tournament, Participant } from "../../types";

export const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { tournaments } = await tournamentApi.list();
        const t =
          tournaments.find((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED") ||
          tournaments[0] ||
          null;
        setTournament(t);

        if (t) {
          const { participants } = await tournamentApi.participants(t._id);
          const p = participants.find((p) => p.user._id === user?._id);
          setParticipant(p || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const isApproved = participant?.registrationStatus === "APPROVED";
  const isPending = participant?.registrationStatus === "PENDING";
  const isRejected = participant?.registrationStatus === "REJECTED";
  const isEliminated = participant?.status === "ELIMINATED";
  const hasAdvanced = participant?.status === "ADVANCED" || participant?.status === "CHAMPION";

  const statusText = isApproved
    ? "✅ Approved"
    : isPending
      ? "⏳ Pending"
      : isRejected
        ? "❌ Rejected"
        : isEliminated
          ? "❌ Eliminated"
          : hasAdvanced
            ? "⭐ Advanced"
            : "Not Registered";

  return (
    <div className="participant-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}</h1>
        <p className="subtitle">Here's your current tournament status</p>
      </div>

      {participant ? (
        <>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Tournament</div>
              <div className="status-value">{tournament?.name || "—"}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Status</div>
              <div
                className={`status-value ${isApproved ? "approved" : isPending ? "pending" : isRejected ? "rejected" : ""}`}
              >
                {statusText}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Group</div>
              <div className="status-value">
                {participant.group ? `Group ${participant.group}` : "—"}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Seed</div>
              <div className="status-value">#{participant.seed || "—"}</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <Medal size={20} />
              <div>
                <div className="stat-label">Rank</div>
                <div className="stat-value">#{participant.rank || "—"}</div>
              </div>
            </div>
            <div className="stat-card">
              <Trophy size={20} />
              <div>
                <div className="stat-label">Score</div>
                <div className="stat-value">{participant.score || 0} pts</div>
              </div>
            </div>
            <div className="stat-card">
              <Star size={20} />
              <div>
                <div className="stat-label">Solved</div>
                <div className="stat-value">{participant.solved || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <Clock size={20} />
              <div>
                <div className="stat-label">Penalty</div>
                <div className="stat-value">{participant.penalty || 0}</div>
              </div>
            </div>
          </div>

          <div className="phase-card">
            <div className="phase-label">Current Phase</div>
            <div className="phase-value">
              {tournament?.currentStage || tournament?.status || "Registration"}
            </div>
            <div className="phase-status">
              {isEliminated ? (
                <>
                  <XCircle size={18} /> Eliminated
                </>
              ) : hasAdvanced ? (
                <>
                  <CheckCircle2 size={18} /> Advanced
                </>
              ) : isApproved ? (
                <>
                  <Clock size={18} /> Active
                </>
              ) : (
                <>
                  <Clock size={18} /> Pending
                </>
              )}
            </div>
          </div>

          <div className="dashboard-actions">
            <Link to={`/dashboard/tournaments/${tournament?._id}`} className="btn-primary">
              View Tournament
            </Link>
            <Link to="/dashboard/standings" className="btn-outline">
              View Standings
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Trophy size={48} />
          <h3>Not Registered</h3>
          <p>You haven't joined any tournaments yet.</p>
          <Link to="/tournaments" className="btn-primary">
            Browse Tournaments
          </Link>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
