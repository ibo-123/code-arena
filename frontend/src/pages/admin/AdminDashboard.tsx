import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Badge, ErrorState, LoadingState } from "../../components/ui";
import {
  Trophy,
  Users,
  Clock,
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
import {
  PageHeader,
  Button,
  Alert,
  AdminCard,
  StatCard,
  globalStyles,
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";

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
      setTimeout(() => setNotice(""), 3000);
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
      <div style={{ padding: "24px 0" }}>
        <PageHeader
          eyebrow="Tournament Control Center"
          title="Admin Overview"
          subtitle="Monitor and manage tournament progress in real-time"
        />
        <AdminCard
          padding="80px 40px"
          style={{ textAlign: "center", maxWidth: "600px", margin: "40px auto" }}
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
          <h3
            style={{
              color: tokens.colors.text.secondary,
              marginTop: 0,
              fontSize: "24px",
            }}
          >
            No Tournament Selected
          </h3>
          <p style={{ color: tokens.colors.text.muted, marginBottom: "24px" }}>
            Create a tournament to get started with the admin panel
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/admin/tournaments/create")}
            icon={<Sparkles size={20} />}
          >
            Create Tournament
          </Button>
        </AdminCard>
        <style>{globalStyles}</style>
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
        return tokens.colors.accent.gold;
      case "REGISTRATION":
        return tokens.colors.accent.blue;
      case "ACTIVE":
        return tokens.colors.accent.green;
      default:
        return tokens.colors.text.muted;
    }
  };

  const getStatusTone = (status: string): "gold" | "green" | "blue" | "muted" => {
    switch (status) {
      case "COMPLETED":
        return "gold";
      case "ACTIVE":
        return "green";
      case "REGISTRATION":
        return "blue";
      default:
        return "muted";
    }
  };

  return (
    <div style={{ padding: "24px 0", minHeight: "100vh", color: tokens.colors.text.primary }}>
      {/* Header */}
      <PageHeader
        eyebrow="Tournament Control Center"
        title="Admin Overview"
        subtitle="Monitor and manage tournament progress in real-time"
        actions={
          <>
            <Badge tone={getStatusTone(selectedTournament.status || "")}>
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: getStatusColor(selectedTournament.status || ""),
                  marginRight: "6px",
                }}
              />
              {selectedTournament.status || "DRAFT"}
            </Badge>

            <Button
              variant="gold"
              onClick={() => navigate("/admin/tournaments/create")}
              icon={<Plus size={16} />}
            >
              New Tournament
            </Button>

            <Button onClick={handleRefresh} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {/* Alerts */}
      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
      {notice && <Alert type="success" message={notice} onDismiss={() => setNotice("")} />}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard
          label="Tournament"
          value={selectedTournament.name || "Code Arena 2026"}
          icon={<Trophy size={22} color={tokens.colors.accent.gold} />}
          bgColor="rgba(255,215,0,0.08)"
          subtitle={selectedTournament.currentStage || "Not started"}
        />
        <StatCard
          label="Participants"
          value={`${participantCount} / ${maxParticipants}`}
          icon={<Users size={22} color={tokens.colors.accent.blue} />}
          bgColor="rgba(41,121,255,0.08)"
          subtitle={`${progress}% capacity`}
        />
        <StatCard
          label="Current Stage"
          value={selectedTournament.currentStage?.replace("_", " ") || "—"}
          icon={<Clock size={22} color={tokens.colors.accent.green} />}
          bgColor="rgba(0,230,118,0.08)"
          subtitle={isCompleted ? "✅ Completed" : "🔄 In progress"}
        />
        <StatCard
          label="Average Score"
          value={avgScore}
          icon={<TrendingUp size={22} color={tokens.colors.accent.purple} />}
          bgColor="rgba(156,39,176,0.08)"
          subtitle={`${participantCount} participants`}
        />
      </div>

      {/* Registration Progress */}
      <AdminCard padding="22px 28px" style={{ marginBottom: "28px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} color={tokens.colors.accent.gold} style={{ opacity: 0.6 }} />
              <small
                style={{
                  fontSize: "11px",
                  color: tokens.colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: 600,
                }}
              >
                Registration Progress
              </small>
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: tokens.colors.text.secondary,
                marginTop: "2px",
              }}
            >
              {participantCount} of {maxParticipants} spots filled
            </div>
          </div>
          <div
            style={{
              padding: "4px 16px",
              borderRadius: tokens.radius.full,
              fontSize: "14px",
              fontWeight: 700,
              background: progress >= 100 ? "rgba(255,215,0,0.15)" : "rgba(41,121,255,0.15)",
              color: progress >= 100 ? tokens.colors.accent.gold : tokens.colors.accent.blue,
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
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              background: progress >= 100 ? tokens.gradients.gold : tokens.gradients.brand,
              borderRadius: "6px",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 20px rgba(41,121,255,0.2)",
            }}
          />
          {progress >= 100 && (
            <div
              style={{
                position: "absolute",
                right: "4px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: tokens.colors.accent.gold,
                fontWeight: 700,
              }}
            >
              🎉
            </div>
          )}
        </div>
      </AdminCard>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <AdminCard variant="gold" padding="22px 28px" style={{ marginBottom: "28px" }}>
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
                borderRadius: tokens.radius.md,
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Medal size={18} color={tokens.colors.accent.gold} />
            </div>
            <small
              style={{
                fontSize: "11px",
                color: tokens.colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              Top Performers
            </small>
            <span
              style={{
                fontSize: "10px",
                color: tokens.colors.text.muted,
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
              <AdminCard
                key={p._id}
                padding="12px 16px"
                hoverable
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background:
                      p.rank === 1
                        ? tokens.gradients.gold
                        : p.rank === 2
                          ? "linear-gradient(135deg, #E0E0E0, #9E9E9E)"
                          : "linear-gradient(135deg, #CD7F32, #A67B5B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: p.rank === 1 ? tokens.colors.bg.primary : "white",
                    flexShrink: 0,
                  }}
                >
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: tokens.colors.text.primary,
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
                      color: tokens.colors.text.muted,
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
                  <Crown
                    size={16}
                    color={tokens.colors.accent.gold}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </AdminCard>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Stage Control */}
      <AdminCard
        padding="28px"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
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
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: tokens.radius.md,
              background: "rgba(255,215,0,0.08)",
            }}
          >
            <Zap size={18} color={tokens.colors.accent.gold} />
          </div>
          <small
            style={{
              fontSize: "11px",
              color: tokens.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
            }}
          >
            Advancement & Stage Control
          </small>
        </div>

        <h3
          style={{
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 6px 0",
            color: tokens.colors.text.primary,
            letterSpacing: "-0.5px",
            position: "relative",
          }}
        >
          Trigger Stage Transitions
        </h3>

        <p
          style={{
            color: tokens.colors.text.muted,
            fontSize: "14px",
            marginBottom: "24px",
            position: "relative",
          }}
        >
          Manage tournament progression through group stage draw, knockout quarter-finals,
          semi-finals, and grand final completion.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            position: "relative",
          }}
        >
          {selectedTournament.status === "REGISTRATION" && (
            <Button
              variant="success"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.start(selectedTournament._id),
                  "Tournament started & groups drawn! 🎯",
                )
              }
              icon={<Play size={18} />}
            >
              Start & Draw Groups
            </Button>
          )}

          {selectedTournament.currentStage === "GROUP_STAGE" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "group-stage"),
                  "Advanced top 8 to Quarter-Finals! 🏆",
                )
              }
              icon={<ArrowRight size={18} />}
            >
              Advance to Quarter-Finals (Top 8)
            </Button>
          )}

          {selectedTournament.currentStage === "QUARTER_FINAL" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "quarter-final"),
                  "Advanced QF winners to Semi-Finals! 🚀",
                )
              }
              icon={<ArrowRight size={18} />}
              style={{ background: tokens.gradients.purple }}
            >
              Advance to Semi-Finals
            </Button>
          )}

          {selectedTournament.currentStage === "SEMI_FINAL" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "semi-final"),
                  "Advanced SF winners to Grand Final! ⚡",
                )
              }
              icon={<ArrowRight size={18} />}
              style={{ background: tokens.gradients.pink }}
            >
              Advance to Grand Final
            </Button>
          )}

          {selectedTournament.currentStage === "FINAL" && (
            <Button
              variant="gold"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "complete"),
                  "Tournament completed & Champion crowned! 🏆",
                )
              }
              icon={<Crown size={18} />}
            >
              Crown Champion & Complete
            </Button>
          )}

          {isCompleted && (
            <div
              style={{
                padding: "14px 24px",
                borderRadius: tokens.radius.lg,
                background: "rgba(255,215,0,0.08)",
                border: "1px solid rgba(255,215,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: tokens.colors.accent.gold,
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              <Gift size={20} />
              Tournament Completed
            </div>
          )}
        </div>
      </AdminCard>

      {/* Tournament Selector */}
      {tournaments.length > 0 && (
        <AdminCard
          padding="16px 20px"
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <Star size={16} color={tokens.colors.text.muted} />
          <label
            style={{
              color: tokens.colors.text.secondary,
              fontSize: "13px",
              fontWeight: 500,
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
              borderRadius: tokens.radius.md,
              background: tokens.colors.bg.input,
              border: `1px solid ${tokens.colors.border.subtle}`,
              color: tokens.colors.text.primary,
              minWidth: "240px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              transition: "all 0.3s ease",
            }}
          >
            {tournaments.map((item) => (
              <option
                key={item._id}
                value={item._id}
                style={{
                  background: tokens.colors.bg.secondary,
                  color: tokens.colors.text.primary,
                }}
              >
                {item.name}
              </option>
            ))}
          </select>
        </AdminCard>
      )}

      <style>{globalStyles}</style>
    </div>
  );
};

export default AdminDashboard;
