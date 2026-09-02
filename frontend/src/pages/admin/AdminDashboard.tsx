import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { ErrorState, LoadingState } from "../../components/ui";
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
  Medal,
  Plus,
  TrendingUp,
  Zap,
  Gift,
  Star,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Participant } from "../../types";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { selectedTournament, tournaments, refreshTournaments } = useAdmin();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    if (!selectedTournament) return;
    try {
      const { participants: data } = await tournamentApi.participants(selectedTournament._id);
      setParticipants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load participants");
    }
  };

  useEffect(() => {
    if (selectedTournament) {
      loadMetrics();
    }
    setLoading(false);
  }, [selectedTournament]);

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMsg);
      await loadMetrics();
      await refreshTournaments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTournaments();
      if (selectedTournament) {
        const { participants: data } = await tournamentApi.participants(selectedTournament._id);
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

  if (!selectedTournament) {
    return (
      <div
        className="glass-card"
        style={{
          textAlign: "center",
          padding: "80px 40px",
          maxWidth: "600px",
          margin: "40px auto",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(255,215,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Trophy size={40} color="rgba(255,215,0,0.2)" />
        </div>
        <h3 style={{ color: "var(--text-secondary)", marginTop: "0", fontSize: "24px" }}>
          No Tournament Selected
        </h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
          Create a tournament to get started with the admin panel
        </p>
        <button
          onClick={() => navigate("/admin/tournaments/create")}
          className="glow-blue"
          style={{
            padding: "14px 32px",
            borderRadius: "14px",
            background: "var(--gradient-brand)",
            border: "none",
            color: "white",
            fontWeight: "700",
            fontSize: "15px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(41,121,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(41,121,255,0.15)";
          }}
        >
          <Sparkles size={20} />
          Create Tournament
        </button>
      </div>
    );
  }

  const participantCount = participants.length;
  const maxParticipants = selectedTournament.maxParticipants || 20;
  const isCompleted = selectedTournament.status === "COMPLETED";
  const progress = Math.round((participantCount / maxParticipants) * 100);

  const topPerformers = participants
    .filter((p) => p.rank && p.rank <= 3)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
  const avgScore = participantCount > 0 ? Math.round(totalScore / participantCount) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "var(--gold)";
      case "REGISTRATION":
        return "var(--blue)";
      case "ACTIVE":
        return "var(--green)";
      default:
        return "var(--text-muted)";
    }
  };

  return (
    <div
      style={{
        padding: "24px 0",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "36px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(255,215,0,0.1)",
                border: "1px solid rgba(255,215,0,0.15)",
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--gold)",
              }}
            >
              <Sparkles size={12} style={{ marginRight: "4px", display: "inline" }} />
              Live
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Tournament Control Center
            </span>
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: "clamp(28px, 3vw, 38px)",
              fontWeight: "800",
              margin: "4px 0 0 0",
              letterSpacing: "-0.5px",
            }}
          >
            Admin Overview
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Monitor and manage tournament progress in real-time
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: getStatusColor(selectedTournament.status || ""),
              }}
            />
            {selectedTournament.status || "DRAFT"}
          </div>

          <button
            onClick={() => navigate("/admin/tournaments/create")}
            className="glow-gold"
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              background: "var(--gradient-gold)",
              border: "none",
              color: "var(--bg-primary)",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(255,215,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            New Tournament
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "500",
              cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            color: "var(--red)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            borderColor: "rgba(255,23,68,0.2)",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {notice && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            color: "var(--green)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            borderColor: "rgba(0,230,118,0.2)",
          }}
        >
          <CheckCircle size={20} />
          {notice}
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {[
          {
            label: "Tournament",
            value: selectedTournament.name || "Code Arena 2026",
            icon: Trophy,
            color: "var(--gold)",
            bgColor: "rgba(255,215,0,0.08)",
            subtitle: selectedTournament.currentStage || "Not started",
          },
          {
            label: "Participants",
            value: `${participantCount} / ${maxParticipants}`,
            icon: Users,
            color: "var(--blue)",
            bgColor: "rgba(41,121,255,0.08)",
            subtitle: `${progress}% capacity`,
          },
          {
            label: "Current Stage",
            value: selectedTournament.currentStage?.replace("_", " ") || "—",
            icon: Clock,
            color: "var(--green)",
            bgColor: "rgba(0,230,118,0.08)",
            subtitle: isCompleted ? "✅ Completed" : "🔄 In progress",
          },
          {
            label: "Average Score",
            value: avgScore,
            icon: TrendingUp,
            color: "var(--purple)",
            bgColor: "rgba(156,39,176,0.08)",
            subtitle: `${participantCount} participants`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(41,121,255,0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                background: stat.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <stat.icon size={22} color={stat.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontWeight: "600",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {stat.value}
              </div>
              {stat.subtitle && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {stat.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Registration Progress */}
      <div
        className="glass-card"
        style={{
          padding: "22px 28px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={16} color="var(--gold)" style={{ opacity: 0.6 }} />
              <small
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: "600",
                }}
              >
                Registration Progress
              </small>
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {participantCount} of {maxParticipants} spots filled
            </div>
          </div>
          <div
            style={{
              padding: "4px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "700",
              background: progress >= 100 ? "rgba(255,215,0,0.15)" : "rgba(41,121,255,0.15)",
              color: progress >= 100 ? "var(--gold)" : "var(--blue)",
            }}
          >
            {progress}%
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: "10px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative" as const,
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              background: progress >= 100 ? "var(--gradient-gold)" : "var(--gradient-brand)",
              borderRadius: "6px",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 20px rgba(41,121,255,0.2)",
            }}
          />
          {progress >= 100 && (
            <div
              style={{
                position: "absolute" as const,
                right: "4px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: "var(--gold)",
                fontWeight: "700",
              }}
            >
              🎉
            </div>
          )}
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: "22px 28px",
            marginBottom: "28px",
            borderColor: "rgba(255,215,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: "10px",
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Medal size={18} color="var(--gold)" />
            </div>
            <small
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: "600",
              }}
            >
              Top Performers
            </small>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginLeft: "auto",
              }}
            >
              🏆 Leaderboard
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {topPerformers.map((p) => (
              <div
                key={p._id}
                className="glass-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background:
                      p.rank === 1
                        ? "var(--gradient-gold)"
                        : p.rank === 2
                          ? "linear-gradient(135deg, #E0E0E0, #9E9E9E)"
                          : "linear-gradient(135deg, #CD7F32, #A67B5B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "16px",
                    color: p.rank === 1 ? "var(--bg-primary)" : "white",
                    flexShrink: 0,
                  }}
                >
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.user?.username || "Anonymous"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>⭐ {p.score || 0} pts</span>
                    <span>•</span>
                    <span>#{p.rank}</span>
                  </div>
                </div>
                {p.rank === 1 && (
                  <Crown size={16} color="var(--gold)" style={{ marginLeft: "auto" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Control */}
      <div
        className="glass-card"
        style={{
          padding: "28px",
          position: "relative" as const,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute" as const,
            top: "-50%",
            right: "-20%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(41,121,255,0.03), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            position: "relative" as const,
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: "10px",
              background: "rgba(255,215,0,0.08)",
            }}
          >
            <Zap size={18} color="var(--gold)" />
          </div>
          <small
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: "600",
            }}
          >
            Advancement & Stage Control
          </small>
        </div>

        <h3
          style={{
            fontSize: "22px",
            fontWeight: "800",
            margin: "0 0 6px 0",
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
            position: "relative" as const,
          }}
        >
          Trigger Stage Transitions
        </h3>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "24px",
            position: "relative" as const,
          }}
        >
          Manage tournament progression through group stage draw, knockout quarter-finals,
          semi-finals, and grand final completion.
        </p>

        {selectedTournament ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              position: "relative" as const,
            }}
          >
            {selectedTournament.status === "REGISTRATION" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.start(selectedTournament._id),
                    "Tournament started & groups drawn! 🎯",
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "14px",
                  background: busy
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #4CAF50, #2E7D32)",
                  border: "none",
                  color: busy ? "var(--text-muted)" : "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: busy ? "none" : "0 4px 16px rgba(76,175,80,0.3)",
                }}
              >
                <Play size={18} />
                Start & Draw Groups
              </button>
            )}

            {selectedTournament.currentStage === "GROUP_STAGE" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(selectedTournament._id, "group-stage"),
                    "Advanced top 8 to Quarter-Finals! 🏆",
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "14px",
                  background: busy
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #FF9800, #E65100)",
                  border: "none",
                  color: busy ? "var(--text-muted)" : "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: busy ? "none" : "0 4px 16px rgba(255,152,0,0.3)",
                }}
              >
                <ArrowRight size={18} />
                Advance to Quarter-Finals (Top 8)
              </button>
            )}

            {selectedTournament.currentStage === "QUARTER_FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(selectedTournament._id, "quarter-final"),
                    "Advanced QF winners to Semi-Finals! 🚀",
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "14px",
                  background: busy
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #9C27B0, #6A1B9A)",
                  border: "none",
                  color: busy ? "var(--text-muted)" : "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: busy ? "none" : "0 4px 16px rgba(156,39,176,0.3)",
                }}
              >
                <ArrowRight size={18} />
                Advance to Semi-Finals
              </button>
            )}

            {selectedTournament.currentStage === "SEMI_FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(selectedTournament._id, "semi-final"),
                    "Advanced SF winners to Grand Final! ⚡",
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "14px",
                  background: busy
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #E91E63, #880E4F)",
                  border: "none",
                  color: busy ? "var(--text-muted)" : "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: busy ? "none" : "0 4px 16px rgba(233,30,99,0.3)",
                }}
              >
                <ArrowRight size={18} />
                Advance to Grand Final
              </button>
            )}

            {selectedTournament.currentStage === "FINAL" && (
              <button
                disabled={busy}
                onClick={() =>
                  handleAction(
                    () => tournamentApi.advance(selectedTournament._id, "complete"),
                    "Tournament completed & Champion crowned! 🏆",
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "14px",
                  background: busy ? "rgba(255,255,255,0.05)" : "var(--gradient-gold)",
                  border: "none",
                  color: busy ? "var(--text-muted)" : "var(--bg-primary)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: busy ? "none" : "0 4px 16px rgba(255,215,0,0.3)",
                }}
              >
                <Crown size={18} />
                Crown Champion & Complete
              </button>
            )}

            {isCompleted && (
              <div
                style={{
                  padding: "14px 24px",
                  borderRadius: "14px",
                  background: "rgba(255,215,0,0.08)",
                  border: "1px solid rgba(255,215,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "var(--gold)",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                <Gift size={20} />
                Tournament Completed
              </div>
            )}
          </div>
        ) : (
          <div
            className="glass-card"
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              No tournament exists yet. Create one to get started!
            </p>
            <button
              onClick={() => navigate("/admin/tournaments/create")}
              style={{
                padding: "12px 28px",
                borderRadius: "12px",
                background: "var(--gradient-gold)",
                border: "none",
                color: "var(--bg-primary)",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Plus size={16} />
              Create Tournament
            </button>
          </div>
        )}
      </div>

      {/* Tournament Selector */}
      {tournaments.length > 0 && (
        <div
          className="glass-card"
          style={{
            marginTop: "24px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <Star size={16} color="var(--text-muted)" />
          <label
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "500",
              whiteSpace: "nowrap",
            }}
          >
            Switch Tournament:
          </label>
          <select
            value={selectedTournament?._id || ""}
            onChange={async (event) => {
              const selectedId = event.target.value;
              const foundTournament = tournaments.find((item) => item._id === selectedId) || null;
              if (foundTournament) {
                window.location.reload();
              }
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-primary)",
              minWidth: "240px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(41,121,255,0.3)";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,121,255,0.05)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {tournaments.map((item) => (
              <option
                key={item._id}
                value={item._id}
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
