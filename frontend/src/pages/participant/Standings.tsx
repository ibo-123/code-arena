// frontend/src/pages/participant/Standings.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { StandingsEntry } from "../../types";

export const Standings = () => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournamentId, setTournamentId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const { tournaments } = await tournamentApi.list();
        const t = tournaments.find((t) => t.status !== "COMPLETED") || tournaments[0];
        if (t) {
          setTournamentId(t._id);
          const { leaderboard } = await tournamentApi.leaderboard(t._id);
          setStandings(
            leaderboard.map((entry) => ({
              ...entry,
              status: entry.isEliminated ? "ELIMINATED" : entry.hasAdvanced ? "ADVANCED" : "ACTIVE",
            })),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const myUsername = user?.username;

  return (
    <div className="standings-page">
      <div className="page-header">
        <h1>Standings</h1>
        <p>Current tournament leaderboard</p>
      </div>

      <div className="standings-table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Group</th>
              <th>Solved</th>
              <th>Score</th>
              <th>Penalty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry) => {
              const isMe = entry.username === myUsername;
              return (
                <tr key={entry.participantId} className={isMe ? "current-user" : ""}>
                  <td className="rank">#{entry.rank}</td>
                  <td>
                    <strong>{entry.username}</strong>
                    {isMe && <span className="you-badge">You</span>}
                  </td>
                  <td>{entry.group || "—"}</td>
                  <td>{entry.solved}</td>
                  <td className="score">{entry.score}</td>
                  <td>{entry.penalty}</td>
                  <td>
                    <StatusBadge status={entry.status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
