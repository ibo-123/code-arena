// frontend/src/pages/participant/ParticipantTournament.tsx
import { useEffect, useState } from "react";
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  ExternalLink,
  Target,
  Award,
  LayoutDashboard,
  ListOrdered,
  Swords,
  GitBranch,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament, Participant } from "../../types";

export const ParticipantTournament = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "standings", label: "Standings", icon: ListOrdered },
    { path: "contests", label: "Contests", icon: Swords },
    { path: "bracket", label: "Bracket", icon: GitBranch },
  ];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { tournament: t } = await tournamentApi.get(id);
        setTournament(t);
        const { participants } = await tournamentApi.participants(id);
        const p = participants.find((p) => p.user._id === user?._id);
        setParticipant(p || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  if (loading) return <LoadingState variant="spinner" size="lg" label="Loading tournament..." />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <ErrorState error="Tournament not found" />;

  const isActive = tournament.status !== "COMPLETED" && tournament.status !== "CANCELLED";

  return (
    <div className="participant-tournament">
      {/* Back link */}
      <Link to="/dashboard/tournaments" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to My Tournaments</span>
      </Link>

      {/* Tournament Header */}
      <div className="tournament-header">
        <div className="header-glow" />

        <div className="header-content">
          <div className="header-left">
            <div className="header-icon-wrap">
              {isActive ? <Swords size={26} /> : <Award size={26} />}
            </div>

            <div className="header-text">
              <div className="header-breadcrumb">
                <span className="breadcrumb-stage">
                  {tournament.currentStage?.replace(/_/g, " ") || tournament.status}
                </span>
                {isActive && (
                  <span className="live-pill">
                    <span className="live-dot" />
                    Live
                  </span>
                )}
              </div>

              <h1>{tournament.name}</h1>

              <div className="header-meta">
                <StatusBadge status={tournament.status} size="sm" />
                <span className="meta-item">
                  <Users size={13} />
                  {tournament.participantCount || 0} participants
                </span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {participant ? (
              <div className="participant-card">
                <div className="participant-card-header">
                  <Target size={14} />
                  <span>Your Status</span>
                </div>
                <div className="participant-card-body">
                  <StatusBadge
                    status={participant.registrationStatus || participant.status || "PENDING"}
                    size="sm"
                  />
                  {participant.group && (
                    <span className="stat-pill">Group {participant.group}</span>
                  )}
                  {participant.rank && (
                    <span className="stat-pill rank-pill">#{participant.rank}</span>
                  )}
                </div>
              </div>
            ) : (
              <Link to={`/tournaments/${id}`} className="btn-view-public">
                <ExternalLink size={16} />
                <span>View Public Page</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        {tabs.map((tab) => {
          const fullPath = `/dashboard/tournaments/${id}${tab.path ? `/${tab.path}` : ""}`;
          const isActive = location.pathname === fullPath;
          const Icon = tab.icon;

          return (
            <Link key={tab.path} to={fullPath} className={`tab-link ${isActive ? "active" : ""}`}>
              <Icon size={16} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        <Outlet />
      </div>

      <style>{`
        .participant-tournament {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
        }

        /* Back link */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          align-self: flex-start;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: white;
          transform: translateX(-4px);
        }

        /* Header */
        .tournament-header {
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
          background: radial-gradient(circle, rgba(41, 121, 255, 0.18), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex: 1;
          min-width: 0;
        }

        .header-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.35);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .header-icon-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
        }

        .header-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .header-breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .breadcrumb-stage {
          font-size: 11px;
          font-weight: 700;
          color: #64B5F6;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 4px 10px;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.2);
          border-radius: 100px;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(76, 175, 80, 0.12);
          border: 1px solid rgba(76, 175, 80, 0.25);
          color: #4CAF50;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4CAF50;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
          animation: livePulse 1.5s infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .header-text h1 {
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 800;
          margin: 0;
          line-height: 1.15;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .meta-item svg {
          color: #64B5F6;
          opacity: 0.7;
        }

        /* Right side */
        .header-right {
          flex-shrink: 0;
        }

        .participant-card {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          min-width: 200px;
        }

        .participant-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .participant-card-header svg {
          color: #FFD700;
        }

        .participant-card-body {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stat-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.2);
          color: #64B5F6;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rank-pill {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(255, 215, 0, 0.2);
          color: #FFD700;
        }

        .btn-view-public {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.3);
        }

        .btn-view-public:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.45);
        }

        /* Tabs */
        .tabs-nav {
          display: flex;
          gap: 6px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow-x: auto;
        }

        .tab-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          transition: all 0.25s ease;
          white-space: nowrap;
          position: relative;
        }

        .tab-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.04);
        }

        .tab-link.active {
          color: white;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.2), rgba(41, 121, 255, 0.08));
          box-shadow: 0 4px 16px rgba(41, 121, 255, 0.15);
        }

        .tab-link.active::before {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          border-radius: 100px;
          background: #64B5F6;
          box-shadow: 0 0 8px #2979FF;
        }

        .tab-link svg {
          opacity: 0.7;
        }

        .tab-link.active svg {
          color: #64B5F6;
          opacity: 1;
        }

        /* Content */
        .tab-content {
          min-height: 200px;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .header-content {
            flex-direction: column;
          }

          .header-right {
            width: 100%;
          }

          .participant-card {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .tournament-header {
            padding: 24px;
          }

          .header-icon-wrap {
            width: 52px;
            height: 52px;
          }

          .header-left {
            gap: 14px;
          }

          .tabs-nav {
            gap: 4px;
            padding: 4px;
          }

          .tab-link {
            padding: 10px 14px;
            font-size: 13px;
          }

          .tab-link span {
            display: none;
          }

          .tab-link {
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticipantTournament;
