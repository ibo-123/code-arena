// frontend/src/pages/participant/Standings.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Medal, Users, TrendingUp, Target, Award, ListOrdered } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { StandingsEntry } from "../../types";
import "./Standings.css";

export const Standings = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let tournamentId = id;

        // No :id in URL → fall back to the first active tournament
        if (!tournamentId) {
          const { tournaments } = await tournamentApi.list();
          const t = tournaments.find((t) => t.status !== "COMPLETED") || tournaments[0];
          tournamentId = t?._id;
        }

        if (tournamentId) {
          const { leaderboard } = await tournamentApi.leaderboard(tournamentId);
          if (cancelled) return;
          setStandings(
            leaderboard.map((entry) => ({
              ...entry,
              status: entry.isEliminated ? "ELIMINATED" : entry.hasAdvanced ? "ADVANCED" : "ACTIVE",
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading standings..." />;
  }
  if (error) return <ErrorState error={error} />;

  const myUsername = user?.username;
  const myEntry = standings.find((s) => s.username === myUsername);
  const topThree = standings.slice(0, 3);

  return (
    <div className="standings-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <ListOrdered size={24} />
          </div>
          <div>
            <h1>Standings</h1>
            <p className="subtitle">{standings.length} participants · Live leaderboard</p>
          </div>
        </div>
      </div>

      {standings.length > 0 ? (
        <>
          {/* Podium (top 3) */}
          {topThree.length === 3 && (
            <div className="podium">
              {[1, 0, 2].map((idx) => {
                const entry = topThree[idx];
                const place = idx + 1;
                const medalColor = place === 1 ? "#FFD700" : place === 2 ? "#C0C0C0" : "#CD7F32";
                const isMe = entry.username === myUsername;

                return (
                  <div
                    key={entry.participantId}
                    className={`podium-item place-${place} ${isMe ? "is-me" : ""}`}
                    style={{ "--medal": medalColor } as React.CSSProperties}
                  >
                    <div className="podium-rank-badge">
                      <Medal size={16} />
                      <span>#{entry.rank}</span>
                    </div>

                    <div className="podium-avatar">
                      {(entry.username || "?").charAt(0).toUpperCase()}
                      <div className="podium-medal" />
                    </div>

                    <div className="podium-name">
                      {entry.username}
                      {isMe && <span className="you-tag">You</span>}
                    </div>

                    <div className="podium-stats">
                      <div className="podium-stat">
                        <span className="podium-stat-value">{entry.score ?? 0}</span>
                        <span className="podium-stat-label">pts</span>
                      </div>
                      <div className="podium-stat">
                        <span className="podium-stat-value">{entry.solved ?? 0}</span>
                        <span className="podium-stat-label">solved</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* My position highlight */}
          {myEntry && (
            <div className="my-position-banner">
              <div className="my-position-glow" />
              <div className="my-position-content">
                <div className="my-position-icon">
                  <Target size={20} />
                </div>
                <div className="my-position-text">
                  <div className="my-position-label">Your Position</div>
                  <div className="my-position-value">
                    Rank #{myEntry.rank} of {standings.length}
                  </div>
                </div>
                <div className="my-position-stats">
                  <div className="my-stat">
                    <TrendingUp size={14} />
                    <span>{myEntry.score ?? 0} pts</span>
                  </div>
                  <div className="my-stat">
                    <Award size={14} />
                    <span>{myEntry.solved ?? 0} solved</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="standings-table-card">
            <div className="table-header">
              <div className="table-title">
                <Users size={18} />
                <span>Full Leaderboard</span>
              </div>
            </div>

            <div className="table-wrap">
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
                    const rank = entry.rank || 0;
                    const isTop3 = rank <= 3;
                    const medalColor =
                      rank === 1
                        ? "#FFD700"
                        : rank === 2
                          ? "#C0C0C0"
                          : rank === 3
                            ? "#CD7F32"
                            : null;

                    return (
                      <tr key={entry.participantId} className={isMe ? "current-user" : ""}>
                        <td>
                          <div
                            className={`rank-cell ${isTop3 ? "top-rank" : ""}`}
                            style={
                              medalColor
                                ? ({
                                    "--medal-color": medalColor,
                                  } as React.CSSProperties)
                                : {}
                            }
                          >
                            {isTop3 && <Medal size={14} />}
                            <span>#{rank}</span>
                          </div>
                        </td>
                        <td>
                          <div className="participant-cell">
                            <div className="participant-avatar">
                              {(entry.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <strong>{entry.username}</strong>
                            {isMe && <span className="you-badge">You</span>}
                          </div>
                        </td>
                        <td>
                          {entry.group ? (
                            <span className="group-cell">{entry.group}</span>
                          ) : (
                            <span className="empty-cell">—</span>
                          )}
                        </td>
                        <td>
                          <span className="solved-cell">{entry.solved ?? 0}</span>
                        </td>
                        <td>
                          <span className="score-cell">{entry.score ?? 0}</span>
                        </td>
                        <td>
                          <span className="penalty-cell">{entry.penalty ?? 0}</span>
                        </td>
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
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Trophy size={48} />
          </div>
          <h3>No standings yet</h3>
          <p>Standings will appear here once the tournament begins.</p>
        </div>
      )}
    </div>
  );
};

export default Standings;
