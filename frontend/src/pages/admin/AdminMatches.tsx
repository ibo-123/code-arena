import { useEffect, useState, useCallback } from "react";
import { Swords, RefreshCw, Crown, AlertCircle, CheckCircle, Users } from "lucide-react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { adminApi } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";

interface MatchParticipant {
  _id: string;
  user?: { username?: string; name?: string };
  group?: string;
  seed?: number;
}

interface Match {
  _id: string;
  stage: string;
  matchNumber: number;
  participants: MatchParticipant[];
  winner?: MatchParticipant | null;
  status: "PENDING" | "LIVE" | "COMPLETED";
  contest?: { codeforcesContestName?: string; name?: string } | null;
}

export const AdminMatches = () => {
  const { selectedTournament } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);

  const tournamentId = selectedTournament?._id;

  const loadMatches = useCallback(async () => {
    if (!tournamentId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const res = await adminApi.getMatches(tournamentId);
      setMatches((res.matches || []) as Match[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    loadMatches();
  }, [loadMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleSetWinner = async (match: Match, winnerId: string) => {
    if (!confirm(`Set winner for Match ${match.matchNumber} (${match.stage.replace("_", " ")})?`))
      return;
    setBusyMatchId(match._id);
    setError("");
    setNotice("");
    try {
      await adminApi.setMatchWinner(match._id, winnerId);
      setNotice("Winner set and advanced to next stage");
      await loadMatches();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set winner");
    } finally {
      setBusyMatchId(null);
    }
  };

  if (!selectedTournament) return <ErrorState error="No tournament selected." />;

  const stageGroups = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"] as const;

  return (
    <div style={{ padding: "24px 0" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <small
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Knockout Stage
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Match Management
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            {selectedTournament.name} · {matches.length} match{matches.length !== 1 ? "es" : ""}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            cursor: refreshing ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(244,67,54,0.1)",
            border: "1px solid rgba(244,67,54,0.2)",
            color: "#FF6B6B",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(76,175,80,0.1)",
            border: "1px solid rgba(76,175,80,0.2)",
            color: "#4CAF50",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading matches..." />
      ) : matches.length === 0 ? (
        <EmptyState label="No matches yet. Advance the tournament to generate the bracket." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {stageGroups.map((stage) => {
            const stageMatches = matches.filter((m) => m.stage === stage);
            if (stageMatches.length === 0) return null;
            return (
              <div key={stage}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <Swords size={18} color="#64B5F6" />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "white",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stage.replace("_", " ")}
                  </h2>
                  <Badge tone="muted">{stageMatches.length}</Badge>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {stageMatches.map((match) => (
                    <Card
                      key={match._id}
                      style={{
                        padding: "16px 18px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Match {match.matchNumber}
                        </span>
                        <Badge
                          tone={
                            match.status === "COMPLETED"
                              ? "green"
                              : match.status === "LIVE"
                                ? "red"
                                : "muted"
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>

                      {match.participants.map((p) => {
                        const isWinner = match.winner?._id === p._id;
                        const canSetWinner = match.status !== "COMPLETED";
                        return (
                          <div
                            key={p._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 10px",
                              marginBottom: "6px",
                              borderRadius: "8px",
                              background: isWinner
                                ? "rgba(255,215,0,0.08)"
                                : "rgba(255,255,255,0.02)",
                              border: isWinner
                                ? "1px solid rgba(255,215,0,0.25)"
                                : "1px solid transparent",
                            }}
                          >
                            <Users size={14} color="rgba(255,255,255,0.3)" />
                            <span
                              style={{
                                flex: 1,
                                fontSize: "13px",
                                fontWeight: isWinner ? "600" : "400",
                                color: isWinner ? "#FFD700" : "rgba(255,255,255,0.8)",
                              }}
                            >
                              {p.user?.username || p.user?.name || "Unknown"}
                              {p.seed ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.3)",
                                    marginLeft: 6,
                                  }}
                                >
                                  #{p.seed}
                                </span>
                              ) : null}
                            </span>
                            {isWinner && <Crown size={14} color="#FFD700" />}
                            {canSetWinner && !isWinner && (
                              <button
                                disabled={busyMatchId === match._id}
                                onClick={() => handleSetWinner(match, p._id)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  background: "rgba(41,121,255,0.15)",
                                  border: "1px solid rgba(41,121,255,0.25)",
                                  color: "#64B5F6",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: busyMatchId === match._id ? "not-allowed" : "pointer",
                                  opacity: busyMatchId === match._id ? 0.5 : 1,
                                }}
                              >
                                Set Winner
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {match.contest && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.4)",
                            textAlign: "center",
                          }}
                        >
                          {match.contest.name || match.contest.codeforcesContestName}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminMatches;
