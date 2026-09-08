// frontend/src/pages/participant/MyTournaments.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament, Participant } from "../../types";

export const MyTournaments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const { tournaments: allTournaments } = await tournamentApi.list();

        const myTournaments: Tournament[] = [];
        const participantMap: Record<string, Participant> = {};

        for (const t of allTournaments) {
          try {
            const { participants: pList } = await tournamentApi.participants(t._id);
            const myP = pList.find((p) => p.user._id === user?._id);
            if (myP) {
              myTournaments.push(t);
              participantMap[t._id] = myP;
            }
          } catch {
            // Skip tournaments that can't be loaded
          }
        }

        setTournaments(myTournaments);
        setParticipants(participantMap);
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

  return (
    <div className="my-tournaments">
      <div className="page-header">
        <h1>My Tournaments</h1>
        <p>View all tournaments you've joined</p>
      </div>

      {tournaments.length > 0 ? (
        <div className="tournaments-list">
          {tournaments.map((t) => {
            const p = participants[t._id];
            return (
              <Link key={t._id} to={`/dashboard/tournaments/${t._id}`} className="tournament-row">
                <div className="tournament-info">
                  <h3>{t.name}</h3>
                  <div className="tournament-meta">
                    <span>
                      <Users size={14} /> {t.participantCount || 0} participants
                    </span>
                    <span>
                      <Calendar size={14} />{" "}
                      {t.tournamentStart ? new Date(t.tournamentStart).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                </div>
                <div className="tournament-status">
                  <StatusBadge status={p?.registrationStatus || p?.status || "PENDING"} />
                  {p?.group && <span className="group-badge">Group {p.group}</span>}
                  <ChevronRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Trophy size={48} />
          <h3>No tournaments yet</h3>
          <p>You haven't joined any tournaments. Browse and register for one!</p>
          <Link to="/tournaments" className="btn-primary">
            Browse Tournaments
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyTournaments;
