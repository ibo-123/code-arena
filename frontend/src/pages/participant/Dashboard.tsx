// frontend/src/pages/participant/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Medal,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Award,
  BarChart3,
  Swords,
  Flame,
} from "lucide-react";
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

  if (loading) return <LoadingState variant="spinner" label="Loading dashboard..." />;
  if (error) return <ErrorState error={error} />;

  const isApproved = participant?.registrationStatus === "APPROVED";
  const isPending = participant?.registrationStatus === "PENDING";
  const isRejected = participant?.registrationStatus === "REJECTED";
  const isEliminated = participant?.status === "ELIMINATED";
  const hasAdvanced = participant?.status === "ADVANCED" || participant?.status === "CHAMPION";

  const statusConfig = isApproved
    ? { label: "Approved", color: "#4CAF50", icon: CheckCircle2, bg: "rgba(76, 175, 80, 0.1)" }
    : isPending
      ? { label: "Pending", color: "#FF9800", icon: Clock, bg: "rgba(255, 152, 0, 0.1)" }
      : isRejected
        ? { label: "Rejected", color: "#EF5350", icon: XCircle, bg: "rgba(239, 83, 80, 0.1)" }
        : isEliminated
          ? { label: "Eliminated", color: "#EF5350", icon: XCircle, bg: "rgba(239, 83, 80, 0.1)" }
          : hasAdvanced
            ? { label: "Advanced", color: "#FFD700", icon: Star, bg: "rgba(255, 215, 0, 0.1)" }
            : { label: "Not Registered", color: "#9E9E9E", icon: Clock, bg: "rgba(158, 158, 158, 0.1)" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="participant-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-greeting">
            <div className="greeting-icon">
              <Flame size={24} />
            </div>
            <div>
              <h1>Welcome back, {user?.username}</h1>
              <p className="subtitle">Here's your current tournament status</p>
            </div>
          </div>
        </div>

        {/* Decorative glow */}
        <div className="header-glow" />
      </div>

      {participant ? (
        <>
          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card">
              <div className="status-card-icon">
                <Trophy size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Tournament</div>
                <div className="status-value">{tournament?.name || "—"}</div>
              </div>
            </div>

            <div className="status-card" style={{ "--status-color": statusConfig.color } as React.CSSProperties}>
              <div className="status-card-icon" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                <StatusIcon size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Status</div>
                <div className="status-value" style={{ color: statusConfig.color }}>
                  {statusConfig.label}
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">
                <Users size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Group</div>
                <div className="status-value">
                  {participant.group ? `Group ${participant.group}` : "—"}
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">
                <Target size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Seed</div>
                <div className="status-value">#{participant.seed || "—"}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon rank">
                <Medal size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Rank</div>
                <div className="stat-value">#{participant.rank || "—"}</div>
              </div>
              <div className="stat-card-trend">
                <TrendingUp size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon score">
                <Trophy size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Score</div>
                <div className="stat-value">{participant.score || 0} <span className="stat-unit">pts</span></div>
              </div>
              <div className="stat-card-trend">
                <BarChart3 size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon solved">
                <Star size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Solved</div>
                <div className="stat-value">{participant.solved || 0}</div>
              </div>
              <div className="stat-card-trend">
                <Award size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon penalty">
                <Clock size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Penalty</div>
                <div className="stat-value">{participant.penalty || 0}</div>
              </div>
              <div className="stat-card-trend">
                <Zap size={14} />
              </div>
            </div>
          </div>

          {/* Phase Card */}
          <div className="phase-card">
            <div className="phase-glow" />
            <div className="phase-header">
              <div className="phase-icon">
                <Swords size={20} />
              </div>
              <div className="phase-label">Current Phase</div>
            </div>

            <div className="phase-value">
              {tournament?.currentStage?.replace(/_/g, " ") || tournament?.status || "Registration"}
            </div>

            <div className="phase-status">
              {isEliminated ? (
                <div className="phase-status-badge eliminated">
                  <XCircle size={18} /> Eliminated
                </div>
              ) : hasAdvanced ? (
                <div className="phase-status-badge advanced">
                  <CheckCircle2 size={18} /> Advanced
                </div>
              ) : isApproved ? (
                <div className="phase-status-badge active">
                  <Clock size={18} /> Active
                </div>
              ) : (
                <div className="phase-status-badge pending">
                  <Clock size={18} /> Pending
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="phase-progress">
              <div className="phase-progress-track">
                <div
                  className="phase-progress-fill"
                  style={{
                    width: hasAdvanced ? "75%" : isApproved ? "50%" : isPending ? "25%" : "10%",
                    background: hasAdvanced
                      ? "linear-gradient(90deg, #FFD700, #FFA000)"
                      : isApproved
                        ? "linear-gradient(90deg, #4CAF50, #2E7D32)"
                        : "linear-gradient(90deg, #FF9800, #F57C00)",
                  }}
                />
              </div>
              <div className="phase-progress-labels">
                <span>Registration</span>
                <span>Group</span>
                <span>Knockout</span>
                <span>Final</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="dashboard-actions">
            <Link to={`/dashboard/tournaments/${tournament?._id}`} className="btn-primary btn-large">
              <span>View Tournament</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard/standings" className="btn-secondary btn-large">
              <BarChart3 size={18} />
              <span>View Standings</span>
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Trophy size={48} />
          </div>
          <h3>Not Registered</h3>
          <p>You haven't joined any tournaments yet. Start your journey now!</p>
          <Link to="/tournaments" className="btn-primary btn-large">
            <span>Browse Tournaments</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      <style>{`
        .participant-dashboard {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 8px 0 40px;
          max-width: 1200px;
        }

        /* ============================================
           HEADER
        ============================================ */
        .dashboard-header {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .dashboard-greeting {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .greeting-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #FF6B6B, #FF9800);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(255, 107, 107, 0.3);
          flex-shrink: 0;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* ============================================
           STATUS GRID
        ============================================ */
        .status-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .status-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .status-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .status-card:hover .status-card-icon {
          transform: scale(1.05);
        }

        .status-card-content {
          min-width: 0;
          flex: 1;
        }

        .status-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }

        .status-value {
          font-size: 15px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ============================================
           STATS GRID
        ============================================ */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(41, 121, 255, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(41, 121, 255, 0.2);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
        }

        .stat-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-card-icon {
          transform: scale(1.08) rotate(-3deg);
        }

        .stat-card-icon.rank {
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
          border: 1px solid rgba(255, 215, 0, 0.15);
        }

        .stat-card-icon.score {
          background: rgba(41, 121, 255, 0.1);
          color: #64B5F6;
          border: 1px solid rgba(41, 121, 255, 0.15);
        }

        .stat-card-icon.solved {
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.15);
        }

        .stat-card-icon.penalty {
          background: rgba(255, 152, 0, 0.1);
          color: #FF9800;
          border: 1px solid rgba(255, 152, 0, 0.15);
        }

        .stat-card-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: white;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .stat-unit {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
        }

        .stat-card-trend {
          color: rgba(255, 255, 255, 0.15);
          transition: color 0.3s ease;
        }

        .stat-card:hover .stat-card-trend {
          color: rgba(100, 181, 246, 0.6);
        }

        /* ============================================
           PHASE CARD
        ============================================ */
        .phase-card {
          position: relative;
          padding: 28px 32px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.05), rgba(156, 39, 176, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
        }

        .phase-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(156, 39, 176, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .phase-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .phase-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(156, 39, 176, 0.15);
          border: 1px solid rgba(156, 39, 176, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #CE93D8;
        }

        .phase-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .phase-value {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
          text-transform: capitalize;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .phase-status {
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .phase-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }

        .phase-status-badge.eliminated {
          background: rgba(239, 83, 80, 0.1);
          color: #EF5350;
          border: 1px solid rgba(239, 83, 80, 0.2);
        }

        .phase-status-badge.advanced {
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .phase-status-badge.active {
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        .phase-status-badge.pending {
          background: rgba(255, 152, 0, 0.1);
          color: #FF9800;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }

        .phase-progress {
          position: relative;
          z-index: 1;
        }

        .phase-progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .phase-progress-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 16px currentColor;
        }

        .phase-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ============================================
           ACTIONS
        ============================================ */
        .dashboard-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 14px 28px;
          font-size: 15px;
          border-radius: 12px;
          gap: 10px;
          font-weight: 600;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.4);
        }

        .btn-primary:hover::before {
          opacity: 1;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }

        /* ============================================
           EMPTY STATE
        ============================================ */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 16px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 24px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .empty-icon {
          width: 88px;
          height: 88px;
          border-radius: 28px;
          background: rgba(255, 215, 0, 0.06);
          border: 1px solid rgba(255, 215, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          margin-bottom: 8px;
        }

        .empty-state h3 {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.4);
          margin: 0 0 12px;
          max-width: 400px;
          line-height: 1.6;
        }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 1024px) {
          .status-grid,
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .dashboard-header {
            padding: 24px;
          }

          .dashboard-header h1 {
            font-size: 22px;
          }

          .dashboard-greeting {
            gap: 14px;
          }

          .greeting-icon {
            width: 48px;
            height: 48px;
          }

          .status-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .phase-card {
            padding: 24px;
          }

          .phase-value {
            font-size: 24px;
          }

          .phase-progress-labels {
            font-size: 9px;
          }

          .dashboard-actions {
            flex-direction: column;
          }

          .dashboard-actions .btn-large {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticipantDashboard;