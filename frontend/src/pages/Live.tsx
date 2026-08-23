import { useEffect, useState } from "react";
import {
  ExternalLink,
  Trophy,
  Users,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Medal,
  Star,
  Award,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { contestApi } from "../services/contestApi";
import { tournamentApi } from "../services/tournamentApi";
import type { Contest, LeaderboardEntry, Tournament } from "../types";

export const Live = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null;
        if (isMounted) setTournament(t);
        if (t) {
          return contestApi.list(t._id);
        }
        return { contests: [] };
      })
      .then(({ contests: items }) => {
        if (isMounted) {
          setContests(items);
          if (items.length > 0) {
            setSelectedContestId(items[0]._id);
          }
        }
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tournament || !selectedContestId) return;
    let isMounted = true;
    setLeaderboardLoading(true);
    contestApi
      .leaderboard(tournament._id, selectedContestId)
      .then(({ leaderboard: rows }) => {
        if (isMounted) setLeaderboard(rows);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLeaderboardLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [tournament, selectedContestId]);

  if (loading) return <LoadingState label="Loading live contest session..." />;
  if (error) return <ErrorState error={error} />;

  const currentContest = contests.find((c) => c._id === selectedContestId);
  const isLive = currentContest?.status === "LIVE";
  const isFinished = currentContest?.status === "FINISHED";
  const isUpcoming = currentContest?.status === "UPCOMING";

  const getStatusColor = () => {
    if (isLive) return "#FF6B6B";
    if (isFinished) return "#4CAF50";
    return "#FFD700";
  };

  const getStatusLabel = () => {
    if (isLive) return "🔴 LIVE";
    if (isFinished) return "✅ FINISHED";
    return "⏳ UPCOMING";
  };

  // Get top 3 performers
  const topPerformers = leaderboard.filter(
    (entry) => entry.rank && entry.rank <= 3,
  );

  return (
    <>
      <Navbar />
      <main
        style={{
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "0 40px 60px",
        }}
      >
        {/* Header */}
        <header
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Trophy size={20} color="#FFD700" />
              <small
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Live Contest Arena
              </small>
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 3vw, 42px)",
                fontWeight: "700",
                margin: 0,
                background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Live Competition
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginTop: "4px",
              }}
            >
              {contests.length} contests · {leaderboard.length} participants
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "100px",
                background: `${getStatusColor()}22`,
                border: `1px solid ${getStatusColor()}44`,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: getStatusColor(),
                  animation: isLive
                    ? "pulse 1.5s ease-in-out infinite"
                    : "none",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: getStatusColor(),
                }}
              >
                {getStatusLabel()}
              </span>
            </div>
            <Badge tone={tournament?.status === "COMPLETED" ? "gold" : "blue"}>
              {tournament?.status || "REGISTRATION"}
            </Badge>
          </div>
        </header>

        {contests.length > 0 ? (
          <>
            {/* Contest Tabs */}
            <div
              style={{
                maxWidth: "1400px",
                margin: "24px auto",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                overflowX: "auto",
                padding: "4px 0",
              }}
            >
              {contests.map((c) => {
                const isActive = c._id === selectedContestId;
                const isLiveContest = c.status === "LIVE";
                return (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelectedContestId(c._id);
                      setLeaderboardLoading(true);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: isActive
                        ? "rgba(41,121,255,0.15)"
                        : "rgba(255,255,255,0.03)",
                      border: isActive
                        ? "1px solid rgba(41,121,255,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      color: isActive ? "white" : "rgba(255,255,255,0.6)",
                      fontWeight: isActive ? "600" : "400",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isLiveContest && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#FF6B6B",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    )}
                    {c.name}
                    <Badge
                      tone={
                        c.status === "LIVE"
                          ? "red"
                          : c.status === "FINISHED"
                            ? "green"
                            : "muted"
                      }
                      style={{
                        fontSize: "9px",
                        padding: "2px 8px",
                      }}
                    >
                      {c.status || "PENDING"}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Contest Info Card */}
            {currentContest && (
              <Card
                style={{
                  maxWidth: "1400px",
                  margin: "0 auto 24px",
                  padding: "24px 28px",
                  background: "rgba(255,255,255,0.03)",
                  border: isLive
                    ? "1px solid rgba(255,107,107,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: isLive
                            ? "rgba(255,107,107,0.15)"
                            : "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isLive ? (
                          <Clock size={18} color="#FF6B6B" />
                        ) : (
                          <Calendar size={18} color="rgba(255,255,255,0.3)" />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <small
                            style={{
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.4)",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {currentContest.round}
                            {currentContest.group &&
                              ` · Group ${currentContest.group}`}
                          </small>
                          {currentContest.matchNumber && (
                            <Badge tone="muted" style={{ fontSize: "10px" }}>
                              Match {currentContest.matchNumber}
                            </Badge>
                          )}
                        </div>
                        <h2
                          style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            margin: "4px 0",
                            color: "white",
                          }}
                        >
                          {currentContest.name}
                        </h2>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <span>
                        ⏱️ Duration: {currentContest.durationMinutes} mins
                      </span>
                      <span>
                        📅 {new Date(currentContest.startTime).toLocaleString()}
                      </span>
                      {currentContest.codeforcesContestId && (
                        <span>🏷️ CF #{currentContest.codeforcesContestId}</span>
                      )}
                    </div>
                  </div>
                  {currentContest.codeforcesUrl && (
                    <a
                      href={currentContest.codeforcesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2979FF, #1565C0)",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      Open Codeforces <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Top Performers */}
            {!leaderboardLoading && topPerformers.length > 0 && (
              <div
                style={{
                  maxWidth: "1400px",
                  margin: "0 auto 24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {topPerformers.map((entry) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  const idx = (entry.rank || 1) - 1;
                  return (
                    <div
                      key={entry.participantId}
                      style={{
                        padding: "16px 20px",
                        background: "rgba(255,215,0,0.03)",
                        borderRadius: "12px",
                        border: `1px solid ${colors[idx] || "rgba(255,255,255,0.06)"}44`,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                        }}
                      >
                        {medals[idx] || `#${entry.rank}`}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "white",
                          }}
                        >
                          {entry.username || entry.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {entry.score} pts · {entry.solved} solved
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Leaderboard */}
            <Card
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <TrendingUp size={18} color="rgba(255,255,255,0.4)" />
                  <small
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Leaderboard ({leaderboard.length} participants)
                  </small>
                </div>
                {leaderboardLoading && (
                  <RefreshCw
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
              </div>

              {leaderboardLoading ? (
                <div style={{ padding: "40px" }}>
                  <LoadingState label="Refreshing standings..." />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <th style={thStyle}>Rank</th>
                        <th style={thStyle}>Participant</th>
                        <th style={thStyle}>Handle</th>
                        <th style={thStyle}>Group</th>
                        <th style={thStyle}>Solved</th>
                        <th style={thStyle}>Score</th>
                        <th style={thStyle}>Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length ? (
                        leaderboard.map((entry, index) => {
                          const isTop3 = entry.rank && entry.rank <= 3;
                          const medalEmoji =
                            entry.rank === 1
                              ? "🥇"
                              : entry.rank === 2
                                ? "🥈"
                                : entry.rank === 3
                                  ? "🥉"
                                  : null;
                          return (
                            <tr
                              key={entry.participantId}
                              style={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.03)",
                                transition: "background 0.2s ease",
                                background: isTop3
                                  ? "rgba(255,215,0,0.03)"
                                  : "transparent",
                                animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                              }}
                            >
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "700",
                                  color: isTop3
                                    ? "#FFD700"
                                    : "rgba(255,255,255,0.6)",
                                  fontSize: isTop3 ? "16px" : "14px",
                                }}
                              >
                                {medalEmoji || `#${entry.rank}`}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: isTop3 ? "600" : "400",
                                  color: isTop3 ? "#FFD700" : "white",
                                }}
                              >
                                {entry.username || entry.name}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.5)",
                                  fontSize: "13px",
                                }}
                              >
                                {entry.codeforcesUsername || "—"}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.5)",
                                }}
                              >
                                {entry.group || "—"}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "600",
                                  color: "#4CAF50",
                                }}
                              >
                                {entry.solved}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "700",
                                  color: isTop3 ? "#FFD700" : "#64B5F6",
                                  fontSize: isTop3 ? "18px" : "16px",
                                }}
                              >
                                {entry.score}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.4)",
                                }}
                              >
                                {entry.penalty || 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7}>
                            <div style={{ padding: "40px" }}>
                              <EmptyState label="No leaderboard entries recorded for this contest." />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : (
          <div
            style={{
              maxWidth: "1400px",
              margin: "40px auto",
              padding: "60px 40px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <Trophy
              size={48}
              color="rgba(255,255,255,0.1)"
              style={{ marginBottom: "16px" }}
            />
            <EmptyState label="No live or upcoming contests attached to this tournament yet." />
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "8px",
              }}
            >
              Check back later for upcoming competitions
            </p>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.8); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    </>
  );
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "rgba(255,255,255,0.3)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "500",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "rgba(255,255,255,0.8)",
  verticalAlign: "middle",
};

export default Live;
