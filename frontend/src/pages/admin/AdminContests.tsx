import { useEffect, useState } from "react";
import { AdminContests as AdminContestsComponent } from "../../components/admin";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Badge } from "../../components/ui/Badge";
import { Trophy, RefreshCw, Calendar, Users, Clock } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Tournament } from "../../types";

export const AdminContests = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const { tournaments } = await tournamentApi.list();
      setTournament(tournaments[0] || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tournament",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTournament();
    setRefreshing(false);
  };

  if (loading) return <LoadingState label="Loading tournament contests..." />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <EmptyState label="No active tournament found." />;

  const isCompleted = tournament.status === "COMPLETED";
  const isRegistration = tournament.status === "REGISTRATION";

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
            Codeforces Integration
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Contests Management
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            Attach and manage Codeforces contests for the tournament
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Badge tone={isCompleted ? "gold" : isRegistration ? "blue" : "blue"}>
            {tournament.currentRound || tournament.status || "Registration"}
          </Badge>

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

      {/* Tournament Info Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Tournament",
            value: tournament.name || "Code Arena 2026",
            icon: Trophy,
            color: "#FFD700",
          },
          {
            label: "Status",
            value: tournament.status || "Registration",
            icon: Clock,
            color: isCompleted ? "#FFD700" : "#2979FF",
          },
          {
            label: "Current Round",
            value: tournament.currentRound || "N/A",
            icon: Calendar,
            color: "#4CAF50",
          },
          {
            label: "Max Participants",
            value: tournament.maxParticipants || 20,
            icon: Users,
            color: "#9C27B0",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
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
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminContestsComponent tournament={tournament} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminContests;
