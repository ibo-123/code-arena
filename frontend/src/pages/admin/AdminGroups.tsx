import { useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { RefreshCw, Star } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Participant } from "../../types";
import { useAdmin } from "../../context/AdminContext";
import {
  PageHeader,
  Button,
  AdminCard,
  AdminEmptyState,
  globalStyles,
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";
export const AdminGroups = () => {
  const { selectedTournament } = useAdmin();
  const [groups, setGroups] = useState<Record<string, Participant[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!selectedTournament) return;
    try {
      setError("");
      const { groups: map } = await tournamentApi.groups(selectedTournament._id);
      setGroups(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    }
  };

  useEffect(() => {
    if (!selectedTournament) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchGroups().finally(() => setLoading(false));
  }, [selectedTournament]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  if (loading) return <LoadingState label="Loading group seeding..." />;
  if (error) return <ErrorState error={error} />;

  if (!selectedTournament) {
    return (
      <div style={{ padding: "24px 0" }}>
        <PageHeader eyebrow="Group Stage Allocation" title="Groups & Seeding" />
        <AdminEmptyState
          icon={<Star size={32} color={tokens.colors.text.muted} />}
          title="No tournament selected"
          description="Please select a tournament from the sidebar to view groups."
        />
      </div>
    );
  }

  const groupKeys = Object.keys(groups).length ? Object.keys(groups).sort() : [];
  const allParticipants = Object.values(groups).flat();
  const totalParticipants = allParticipants.length;
  const groupsWithParticipants = groupKeys.filter((key) => (groups[key] || []).length > 0);
  const activeGroupsCount = groupsWithParticipants.length;

  const groupStats = groupKeys.map((key) => {
    const players = groups[key] || [];
    const active = players.filter((p) => p.status !== "ELIMINATED").length;
    const avgSeed =
      players.length > 0
        ? Math.round(players.reduce((sum, p) => sum + (p.seed || 0), 0) / players.length)
        : 0;
    return { key, count: players.length, active, avgSeed };
  });

  if (groupKeys.length === 0) {
    return (
      <div style={{ padding: "24px 0" }}>
        <PageHeader
          eyebrow="Group Stage Allocation"
          title="Groups & Seeding"
          actions={
            <Button onClick={handleRefresh} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          }
        />
        <AdminEmptyState
          icon={<Star size={32} color={tokens.colors.text.muted} />}
          title="No groups created yet"
          description="Start the tournament to generate groups automatically."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      <PageHeader
        eyebrow="Group Stage Allocation"
        title="Groups & Seeding"
        subtitle={`${totalParticipants} participants across ${activeGroupsCount} groups`}
        actions={
          <>
            <Badge tone="green">{activeGroupsCount} Groups</Badge>
            <Button onClick={handleRefresh} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {/* Group Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: tokens.spacing.lg,
        }}
      >
        {groupStats.map(({ key, count, active, avgSeed }) => (
          <AdminCard
            key={key}
            padding="14px 18px"
            onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}
            style={{
              cursor: "pointer",
              borderColor:
                selectedGroup === key ? "rgba(76, 175, 80, 0.3)" : tokens.colors.border.subtle,
              background: selectedGroup === key ? "rgba(76, 175, 80, 0.05)" : tokens.colors.bg.card,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Group {key}</span>
              <Badge tone={active === count ? "green" : "muted"}>
                {active}/{count}
              </Badge>
            </div>
            <div style={{ fontSize: "12px", color: tokens.colors.text.muted }}>
              {count} participants · Avg seed {avgSeed}
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Group Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {groupKeys.map((groupKey) => {
          const players = groups[groupKey] || [];
          const isActive = players.some((p) => p.status !== "ELIMINATED");
          const topSeeds = [...players]
            .sort((a, b) => (a.seed || 999) - (b.seed || 999))
            .slice(0, 2);

          return (
            <AdminCard
              key={groupKey}
              padding="0"
              style={{
                overflow: "hidden",
                borderColor:
                  selectedGroup === groupKey
                    ? "rgba(76, 175, 80, 0.3)"
                    : tokens.colors.border.subtle,
                transform: selectedGroup === groupKey ? "scale(1.02)" : "scale(1)",
                boxShadow:
                  selectedGroup === groupKey ? "0 8px 30px rgba(76, 175, 80, 0.1)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {/* Group Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${getGroupColor(groupKey)}, ${getGroupColor(groupKey)}cc)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "white",
                    }}
                  >
                    {groupKey}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>
                      Group {groupKey}
                    </div>
                    <div style={{ fontSize: "11px", color: tokens.colors.text.muted }}>
                      {players.length} participants · {isActive ? "Active" : "Completed"}
                    </div>
                  </div>
                </div>

                {topSeeds.length > 0 && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {topSeeds.map((p) => (
                      <div
                        key={p._id}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "rgba(255,215,0,0.1)",
                          border: "1px solid rgba(255,215,0,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: tokens.colors.accent.gold,
                        }}
                      >
                        #{p.seed}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Participants */}
              <div style={{ padding: "12px 20px" }}>
                {players.length ? (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {players
                      .sort((a, b) => (a.seed || 999) - (b.seed || 999))
                      .map((p) => {
                        const isEliminated = p.status === "ELIMINATED";
                        const isTopSeed = p.seed && p.seed <= 2;

                        return (
                          <div
                            key={p._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              borderRadius: tokens.radius.sm,
                              background: isEliminated
                                ? "rgba(255,255,255,0.02)"
                                : isTopSeed
                                  ? "rgba(255,215,0,0.05)"
                                  : "rgba(255,255,255,0.02)",
                              border:
                                isTopSeed && !isEliminated
                                  ? "1px solid rgba(255,215,0,0.1)"
                                  : "1px solid transparent",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  background: isEliminated
                                    ? "rgba(255,255,255,0.05)"
                                    : isTopSeed
                                      ? "rgba(255,215,0,0.1)"
                                      : "rgba(255,255,255,0.05)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: isEliminated
                                    ? tokens.colors.text.faint
                                    : isTopSeed
                                      ? tokens.colors.accent.gold
                                      : tokens.colors.text.muted,
                                }}
                              >
                                #{p.seed || "—"}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: isTopSeed && !isEliminated ? 600 : 400,
                                    color: isEliminated ? tokens.colors.text.faint : "white",
                                  }}
                                >
                                  {p.user?.name || p.user?.username || "Unknown"}
                                </div>
                                <div style={{ fontSize: "11px", color: tokens.colors.text.muted }}>
                                  @{p.user?.username || "unknown"}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {isTopSeed && !isEliminated && (
                                <Star size={14} color={tokens.colors.accent.gold} />
                              )}
                              <Badge tone={isEliminated ? "muted" : "green"}>
                                {p.status || "Active"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState label={`Group ${groupKey} pending draw.`} />
                )}
              </div>
            </AdminCard>
          );
        })}
      </div>

      <style>{globalStyles}</style>
    </div>
  );
};

const getGroupColor = (groupKey: string): string => {
  const colors: Record<string, string> = {
    A: "#4CAF50",
    B: "#2979FF",
    C: "#FF9800",
    D: "#9C27B0",
    E: "#E91E63",
    F: "#00BCD4",
    G: "#FF5722",
    H: "#795548",
  };
  return colors[groupKey] || "#607D8B";
};

export default AdminGroups;
