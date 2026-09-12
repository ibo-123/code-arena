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
  Calendar,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament, Participant } from "../../types";
import "./ParticipantTournament.css";

export const ParticipantTournament = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Only tabs with real routes in App.tsx
  const tabs = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "standings", label: "Standings", icon: ListOrdered },
  ];

  const basePath = `/dashboard/tournaments/${id}`;
  const isBaseRoute = location.pathname === basePath;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { tournament: t } = await tournamentApi.get(id);
        if (cancelled) return;
        setTournament(t);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load tournament");
        setLoading(false);
        return;
      }

      // Participant lookup is optional — never fails the page
      try {
        const { participants } = await tournamentApi.participants(id);
        const me = participants.find((p) => p.user?._id === user?._id);
        if (!cancelled) setParticipant(me ?? null);
      } catch {
        if (!cancelled) setParticipant(null);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user?._id]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading tournament..." />;
  }
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <ErrorState error="Tournament not found" />;

  const isActive = tournament.status !== "COMPLETED" && tournament.status !== "CANCELLED";

  return (
    <div className="participant-tournament">
      <Link to="/dashboard/tournaments" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to My Tournaments</span>
      </Link>

      <div className="tournament-header">
        <div className="header-glow" aria-hidden="true" />
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

      <div className="tabs-nav" role="tablist">
        {tabs.map((tab) => {
          const fullPath = `${basePath}${tab.path ? `/${tab.path}` : ""}`;
          const isTabActive = location.pathname === fullPath;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path || "overview"}
              to={fullPath}
              className={`tab-link${isTabActive ? " active" : ""}`}
              aria-current={isTabActive ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="tab-content">
        {isBaseRoute ? (
          <TournamentOverviewPanel tournament={tournament} participant={participant} />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

// ---- Inline Overview panel (no separate file needed) -----------------

interface OverviewPanelProps {
  tournament: Tournament;
  participant: Participant | null;
}

const TournamentOverviewPanel = ({ tournament, participant }: OverviewPanelProps) => {
  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "TBD";

  return (
    <div className="overview-panel">
      <div className="overview-card">
        <h2>About this tournament</h2>
        <p>
          {tournament.description || "No description has been provided for this tournament yet."}
        </p>
      </div>

      <div className="overview-grid">
        <div className="overview-stat">
          <div className="overview-stat-icon">
            <Calendar size={18} />
          </div>
          <div>
            <div className="overview-stat-label">Starts</div>
            <div className="overview-stat-value">{formatDate(tournament.tournamentStart)}</div>
          </div>
        </div>

        <div className="overview-stat">
          <div className="overview-stat-icon">
            <Clock size={18} />
          </div>
          <div>
            <div className="overview-stat-label">Current Stage</div>
            <div className="overview-stat-value">
              {tournament.currentStage?.replace(/_/g, " ") || "Not started"}
            </div>
          </div>
        </div>

        <div className="overview-stat">
          <div className="overview-stat-icon">
            <Users size={18} />
          </div>
          <div>
            <div className="overview-stat-label">Participants</div>
            <div className="overview-stat-value">
              {tournament.participantCount || 0} / {tournament.maxParticipants || "—"}
            </div>
          </div>
        </div>

        {participant && (
          <div className="overview-stat overview-stat--highlight">
            <div className="overview-stat-icon">
              <Target size={18} />
            </div>
            <div>
              <div className="overview-stat-label">Your Rank</div>
              <div className="overview-stat-value">
                {participant.rank ? `#${participant.rank}` : "Unranked"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantTournament;
