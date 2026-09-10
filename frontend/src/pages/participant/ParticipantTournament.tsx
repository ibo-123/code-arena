// frontend/src/pages/participant/ParticipantTournament.tsx
import { useEffect, useState } from "react";
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament, Participant } from "../../types";

export const ParticipantTournament = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { path: "", label: "Overview" },
    { path: "standings", label: "Standings" },
    { path: "contests", label: "Contests" },
    { path: "bracket", label: "Bracket" },
  ];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { tournament: t } = await tournamentApi.get(id);
        setTournament(t);
        const { participants } = await tournamentApi.participants(id);
        const p = participants.find((p) => p.user._id === participant?._id);
        setParticipant(p || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <div>Tournament not found</div>;

  return (
    <div className="participant-tournament">
      <div className="tournament-header">
        <div className="header-left">
          <h1>{tournament.name}</h1>
          <div className="header-meta">
            <StatusBadge status={tournament.status} />
            <span>{tournament.participantCount || 0} participants</span>
          </div>
        </div>
        <div className="header-right">
          {participant ? (
            <div className="participant-status">
              <StatusBadge
                status={participant.registrationStatus || participant.status || "PENDING"}
              />
              {participant.group && <span>Group {participant.group}</span>}
              {participant.rank && <span>#{participant.rank}</span>}
            </div>
          ) : (
            <Link to={`/tournaments/${id}`} className="btn-primary">
              View Public
            </Link>
          )}
        </div>
      </div>

      <div className="tabs-nav">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === `/dashboard/tournaments/${id}${tab.path ? `/${tab.path}` : ""}`;
          return (
            <Link
              key={tab.path}
              to={`/dashboard/tournaments/${id}${tab.path ? `/${tab.path}` : ""}`}
              className={`tab-link ${isActive ? "active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ParticipantTournament;
