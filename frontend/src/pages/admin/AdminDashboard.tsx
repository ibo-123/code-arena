import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Card, ErrorState, LoadingState } from "../../components/ui";
import {
  Trophy,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  ArrowRight,
  Crown,
  RefreshCw,
  Sparkles,
  BarChart3,
  Medal,
  Plus,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Tournament, Participant } from "../../types";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    if (!tournament) return;
    try {
      const { participants: data } = await tournamentApi.participants(tournament._id);
      setParticipants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load participants");
    }
  };

  useEffect(() => {
    let isMounted = true;
    tournamentApi
      .list()
      .then(({ tournaments: allTournaments }) => {
        if (!isMounted) return;
        setTournaments(allTournaments);
        const selected = allTournaments[0] || null;
        setTournament(selected);
        if (selected) {
          return tournamentApi.participants(selected._id);
        }
        return Promise.resolve({ participants: [] });
      })
      .then((result: any) => {
        if (isMounted && result?.participants) {
          setParticipants(result.participants);
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

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMsg);
      await loadMetrics();
      const { tournaments } = await tournamentApi.list();
      setTournament(tournaments[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { tournaments } = await tournamentApi.list();
      setTournament(tournaments[0] || null);
      if (tournaments[0]) {
        const { participants: data } = await tournamentApi.participants(tournaments[0]._id);
        setParticipants(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingState label="Loading admin dashboard..." />;
  if (error) return <ErrorState error={error} />;

  const participantCount = participants.length;
  const maxParticipants = tournament?.maxParticipants || 20;
  const isCompleted = tournament?.status === "COMPLETED";
  const isRegistration = tournament?.status === "REGISTRATION";
  const progress = Math.round((participantCount / maxParticipants) * 100);

  const topPerformers = participants
    .filter((p) => p.rank && p.rank <= 3)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
  const avgScore = participantCount > 0 ? Math.round(totalScore / participantCount) : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
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
            Tournament Control Center
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Admin Overview
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            Monitor and manage tournament progress
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Badge tone={isCompleted ? "gold" : isRegistration ? "blue" : "blue"}>
            {tournament?.status || "NO TOURNAMENT"}
          </Badge>

          <button
            onClick={() => navigate("/admin/tournaments/create")}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #FFD700, #FFA000)",
              border: "none",
              color: "#0a0e1a",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <Plus size={16} />
            Create Tournament
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
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
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Tournament",
            value: tournament?.name || "Code Arena 2026",
            icon: Trophy,
            color: "#FFD700",
            subtitle: tournament?.currentRound || "Not started",
          },
          {
            label: "Participants",
            value: `${participantCount} / ${maxParticipants}`,
            icon: Users,
            color: "#2979FF",
            subtitle: `${progress}% capacity`,
          },
          {
            label: "Current Round",
            value: tournament?.currentRound || "—",
            icon: Clock,
            color: "#4CAF50",
            subtitle: isCompleted ? "Completed" : "In progress",
          },
          {
            label: "Avg Score",
            value: avgScore,
            icon: BarChart3,
            color: "#9C27B0",
            subtitle: "Points per participant",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: `${stat.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {stat.value}
              </div>
              {stat.subtitle && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "2px",
                  }}
                >
                  {stat.subtitle}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card
        style={{
          padding: "20px 24px",
          marginBottom: "24px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div>
            <small
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Registration Progress
            </small>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.6)",
                marginTop: "2px",
              }}
            >
              {participantCount} of {maxParticipants} spots filled
            </div>
          </div>
          <Badge tone={progress >= 100 ? "gold" : progress >= 75 ? "green" : "blue"}>
            {progress}%
          </Badge>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              background:
                progress >= 100
                  ? "linear-gradient(90deg, #FFD700, #FFA000)"
                  : "linear-gradient(90deg, #2979FF, #64B5F6)",
              borderRadius: "4px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </Card>

      {topPerformers.length > 0 && (
        <Card
          style={{
            padding: "20px 24px",
            marginBottom: "24px",
            background: "rgba(255,215,0,0.03)",
            border: "1px solid rgba(255,215,0,0.1)",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Medal size={18} color="#FFD700" />
            <small
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Top Performers
            </small>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {topPerformers.map((p) => (
              <div
                key={p._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background:
                      p.rank === 1
                        ? "linear-gradient(135deg, #FFD700, #FFA000)"
                        : p.rank === 2
                          ? "linear-gradient(135deg, #C0C0C0, #999)"
                          : "linear-gradient(135deg, #CD7F32, #A67B5B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "12px",
                    color: "#0a0e1a",
                  }}
                >
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {p.user?.username || "Unknown"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {p.score || 0} pts · Rank #{p.rank}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        style={{
          padding: "24px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <Sparkles size={18} color="#FFD700" />
          <small
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Advancement & Stage Control
          </small>
        </div>

        <h3
          style={{
            fontSize: "20px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            color: "white",
          }}
        >
          Trigger Stage Transitions
        </h3>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          Manage tournament progression through group stage draw, knockout quarter-finals,
          semi-finals, and grand final completion.
        </p>

        {tournament ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {tournament.status === "REGISTRATION" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.start(tournament._id),
                    "Tournament started & groups drawn!",
                  )
                }
                style={actionButtonStyle(busy, "#4CAF50")}
              >
                <Play size={18} />
                Start Tournament & Draw Groups
              </button>
            )}

            {tournament.currentRound === "GROUP_STAGE" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(tournament._id, "group-stage"),
                    "Advanced top 8 to Quarter-Finals!",
                  )
                }
                style={actionButtonStyle(busy, "#FF9800")}
              >
                <ArrowRight size={18} />
                Advance Group Stage (Top 8 to QF)
              </button>
            )}

            {tournament.currentRound === "QUARTER_FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(tournament._id, "quarter-final"),
                    "Advanced QF winners to Semi-Finals!",
                  )
                }
                style={actionButtonStyle(busy, "#9C27B0")}
              >
                <ArrowRight size={18} />
                Advance Quarter Finals to Semi Finals
              </button>
            )}

            {tournament.currentRound === "SEMI_FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(tournament._id, "semi-final"),
                    "Advanced SF winners to Grand Final!",
                  )
                }
                style={actionButtonStyle(busy, "#E91E63")}
              >
                <ArrowRight size={18} />
                Advance Semi Finals to Final
              </button>
            )}

            {tournament.currentRound === "FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(tournament._id, "complete"),
                    "Tournament completed & Champion crowned! 🏆",
                  )
                }
                style={actionButtonStyle(busy, "#FFD700", true)}
              >
                <Crown size={18} />
                Crown Champion & Complete Tournament
              </button>
            )}

            {isCompleted && (
              <div
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid rgba(255,215,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#FFD700",
                  fontWeight: "600",
                }}
              >
                <CheckCircle size={18} />
                Tournament Completed
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                marginBottom: "12px",
              }}
            >
              No tournament exists yet. Create one to get started!
            </p>
            <button
              onClick={() => navigate("/admin/tournaments/create")}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FFD700, #FFA000)",
                border: "none",
                color: "#0a0e1a",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              Create Tournament
            </button>
          </div>
        )}
      </Card>

      {tournaments.length > 0 && (
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <label
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Switch Tournament:
          </label>
          <select
            value={tournament?._id || ""}
            onChange={async (event) => {
              const selectedId = event.target.value;
              const selectedTournament =
                tournaments.find((item) => item._id === selectedId) || null;
              setTournament(selectedTournament);

              if (!selectedTournament) {
                setParticipants([]);
                return;
              }

              try {
                const { participants: data } = await tournamentApi.participants(
                  selectedTournament._id,
                );
                setParticipants(data);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load participants");
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white",
              minWidth: "220px",
            }}
          >
            {tournaments.map((item) => (
              <option key={item._id} value={item._id} style={{ color: "#0a0e1a" }}>
                {item.name}
              </option>
            ))}
          </select>
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

const actionButtonStyle = (busy: boolean, color: string, isFinal: boolean = false) => ({
  padding: "12px 24px",
  borderRadius: "12px",
  background: busy
    ? "rgba(255,255,255,0.05)"
    : isFinal
      ? `linear-gradient(135deg, #FFD700, #FFA000)`
      : `linear-gradient(135deg, ${color}, ${color}cc)`,
  border: "none",
  color: busy ? "rgba(255,255,255,0.4)" : isFinal ? "#0a0e1a" : "white",
  fontWeight: "700",
  fontSize: "14px",
  cursor: busy ? "not-allowed" : "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.3s ease",
  opacity: busy ? 0.5 : 1,
});

export default AdminDashboard;
