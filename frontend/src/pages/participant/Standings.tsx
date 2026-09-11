// frontend/src/pages/participant/Standings.tsx
import { useEffect, useState } from "react";
import { Trophy, Medal, Users, TrendingUp, Target, Award, ListOrdered } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { StandingsEntry } from "../../types";

export const Standings = () => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { tournaments } = await tournamentApi.list();
        const t = tournaments.find((t) => t.status !== "COMPLETED") || tournaments[0];
        if (t) {
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

  if (loading) return <LoadingState variant="spinner" size="lg" label="Loading standings..." />;
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
                                ? ({ "--medal-color": medalColor } as React.CSSProperties)
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

      <style>{`
        .standings-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        /* Header */
        .page-header {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .page-header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.1), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #FFD700, #FFA000);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(255, 215, 0, 0.3);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* ============================================
           PODIUM
        ============================================ */
        .podium {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          gap: 16px;
          align-items: end;
          padding: 20px 0;
        }

        .podium-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.35s ease;
          overflow: hidden;
        }

        .podium-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--medal, #FFD700);
          opacity: 0.8;
          box-shadow: 0 0 20px var(--medal, #FFD700);
        }

        .podium-item.place-1 {
          padding-top: 36px;
          padding-bottom: 32px;
          border-color: color-mix(in srgb, var(--medal) 30%, transparent);
          background: linear-gradient(180deg, color-mix(in srgb, var(--medal) 8%, transparent), rgba(255, 255, 255, 0.02));
        }

        .podium-item.is-me {
          border-color: rgba(41, 121, 255, 0.4);
          box-shadow: 0 0 40px rgba(41, 121, 255, 0.15);
        }

        .podium-item:hover {
          transform: translateY(-4px);
        }

        .podium-rank-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 100px;
          background: color-mix(in srgb, var(--medal) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--medal) 30%, transparent);
          color: var(--medal);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .podium-avatar {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: linear-gradient(135deg, var(--medal), color-mix(in srgb, var(--medal) 60%, black));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 26px;
          font-weight: 800;
          box-shadow: 0 12px 32px color-mix(in srgb, var(--medal) 40%, transparent);
        }

        .podium-medal {
          position: absolute;
          bottom: -6px;
          right: -6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--medal);
          border: 3px solid #080A14;
          box-shadow: 0 0 12px var(--medal);
        }

        .place-1 .podium-avatar {
          width: 84px;
          height: 84px;
          font-size: 30px;
        }

        .podium-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 700;
          color: white;
          text-align: center;
        }

        .you-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 100px;
          background: rgba(41, 121, 255, 0.15);
          border: 1px solid rgba(41, 121, 255, 0.3);
          color: #64B5F6;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .podium-stats {
          display: flex;
          gap: 20px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          width: 100%;
          justify-content: center;
        }

        .podium-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .podium-stat-value {
          font-size: 16px;
          font-weight: 800;
          color: white;
        }

        .podium-stat-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        /* ============================================
           MY POSITION BANNER
        ============================================ */
        .my-position-banner {
          position: relative;
          padding: 20px 24px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.1), rgba(41, 121, 255, 0.04));
          border: 1px solid rgba(41, 121, 255, 0.2);
          overflow: hidden;
        }

        .my-position-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.2), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .my-position-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }

        .my-position-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.35);
          flex-shrink: 0;
        }

        .my-position-text {
          flex: 1;
          min-width: 0;
        }

        .my-position-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(100, 181, 246, 0.9);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 4px;
        }

        .my-position-value {
          font-size: 20px;
          font-weight: 800;
          color: white;
        }

        .my-position-stats {
          display: flex;
          gap: 12px;
        }

        .my-stat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 13px;
          font-weight: 700;
        }

        .my-stat svg {
          color: #64B5F6;
        }

        /* ============================================
           TABLE
        ============================================ */
        .standings-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .table-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.01);
        }

        .table-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 700;
          color: white;
        }

        .table-title svg {
          color: #64B5F6;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .standings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .standings-table thead {
          background: rgba(255, 255, 255, 0.02);
        }

        .standings-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .standings-table td {
          padding: 14px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
        }

        .standings-table tbody tr {
          transition: background 0.2s ease;
        }

        .standings-table tbody tr:hover {
          background: rgba(41, 121, 255, 0.04);
        }

        .standings-table tbody tr.current-user {
          background: linear-gradient(90deg, rgba(41, 121, 255, 0.08), transparent);
        }

        .standings-table tbody tr.current-user:hover {
          background: linear-gradient(90deg, rgba(41, 121, 255, 0.12), rgba(41, 121, 255, 0.02));
        }

        .rank-cell {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
        }

        .rank-cell.top-rank {
          color: var(--medal-color, #FFD700);
        }

        .rank-cell.top-rank svg {
          color: var(--medal-color, #FFD700);
          filter: drop-shadow(0 0 6px var(--medal-color, #FFD700));
        }

        .participant-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .participant-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2979FF, #9C27B0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }

        .participant-cell strong {
          color: white;
          font-weight: 700;
        }

        .you-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 100px;
          background: rgba(41, 121, 255, 0.15);
          border: 1px solid rgba(41, 121, 255, 0.3);
          color: #64B5F6;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .group-cell {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(156, 39, 176, 0.1);
          border: 1px solid rgba(156, 39, 176, 0.2);
          color: #CE93D8;
          font-size: 12px;
          font-weight: 700;
        }

        .empty-cell {
          color: rgba(255, 255, 255, 0.2);
        }

        .solved-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          font-weight: 700;
          font-size: 13px;
        }

        .score-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          padding: 3px 12px;
          border-radius: 8px;
          background: rgba(156, 39, 176, 0.1);
          color: #CE93D8;
          font-weight: 800;
          font-size: 13px;
        }

        .penalty-cell {
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
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
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 900px) {
          .podium {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .podium-item.place-1 {
            order: -1;
            padding-top: 24px;
          }

          .place-1 .podium-avatar {
            width: 72px;
            height: 72px;
            font-size: 26px;
          }

          .my-position-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .my-position-stats {
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .page-header {
            padding: 24px;
          }

          .page-header h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 48px;
            height: 48px;
          }

          .standings-table th,
          .standings-table td {
            padding: 12px 14px;
          }

          .participant-cell {
            gap: 8px;
          }

          .participant-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Standings;
