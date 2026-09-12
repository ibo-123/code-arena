import React, { useCallback, useEffect, useState } from "react";
import {
  Trophy,
  TrendingUp,
  Zap,
  RefreshCw,
  Users,
  Crown,
  Target,
  Filter,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";

interface Standing {
  participantId: string;
  username: string;
  name?: string;
  codeforcesUsername?: string;
  group?: string | null;
  rank: number;
  score: number;
  solved: number;
  penalty: number;
  status: string;
  currentStage?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ---- Design tokens (inline, matches your admin theme) ----------------

const c = {
  bg: {
    page: "#080A14",
    card: "rgba(255, 255, 255, 0.02)",
    cardHover: "rgba(255, 255, 255, 0.03)",
    header: "rgba(255, 255, 255, 0.04)",
    rowHover: "rgba(255, 255, 255, 0.03)",
    rowHighlight: "rgba(255, 215, 0, 0.05)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
    gold: "rgba(255, 215, 0, 0.25)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    faint: "rgba(255, 255, 255, 0.3)",
  },
  accent: {
    gold: "#FFD700",
    blue: "#64B5F6",
    green: "#4CAF50",
    purple: "#CE93D8",
    red: "#EF5350",
    orange: "#FF9800",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
} as const;

const getMedalColor = (rank: number): string => {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return c.text.faint;
};

const getGroupColor = (group: string): string => {
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
  return colors[group] || "#607D8B";
};

const getStatusTone = (status: string): { color: string; bg: string; border: string } => {
  switch (status) {
    case "ADVANCED":
      return {
        color: c.accent.green,
        bg: "rgba(76, 175, 80, 0.12)",
        border: "rgba(76, 175, 80, 0.25)",
      };
    case "ELIMINATED":
      return {
        color: c.accent.red,
        bg: "rgba(239, 83, 80, 0.12)",
        border: "rgba(239, 83, 80, 0.25)",
      };
    case "CHAMPION":
      return {
        color: c.accent.gold,
        bg: "rgba(255, 215, 0, 0.12)",
        border: "rgba(255, 215, 0, 0.25)",
      };
    case "ACTIVE":
    default:
      return {
        color: c.accent.blue,
        bg: "rgba(100, 181, 246, 0.12)",
        border: "rgba(100, 181, 246, 0.25)",
      };
  }
};

export const AdminStandings: React.FC = () => {
  const { selectedTournament } = useAdmin();
  const tournamentId = selectedTournament?._id;

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("code-arena-token");

  // ---- Load groups ---------------------------------------------------
  const loadGroups = useCallback(
    async (tId: string) => {
      try {
        const res = await fetch(`${API_URL}/tournaments/${tId}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        const map = data?.groups ?? {};
        const keys = Array.isArray(map)
          ? map.map((g: any) => g.key ?? g.name ?? String(g))
          : Object.keys(map);

        setGroups(keys.sort());
      } catch (err) {
        console.error("Failed to load groups:", err);
      }
    },
    [token],
  );

  // ---- Load standings ------------------------------------------------
  const loadStandings = useCallback(
    async (tId: string, selectedGroup: string | null = null) => {
      try {
        setError(null);

        const url = new URL(`${API_URL}/tournaments/${tId}/leaderboard`);
        if (selectedGroup) url.searchParams.set("group", selectedGroup);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch standings: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        const rows: Standing[] = (data.leaderboard ?? data.standings ?? [])
          .filter((r: any) => (selectedGroup ? r.group === selectedGroup : true))
          .map((r: any) => ({
            participantId: r.participantId ?? r._id,
            username: r.username ?? r.user?.username ?? "unknown",
            name: r.name ?? r.user?.name ?? r.username ?? "Unknown",
            codeforcesUsername: r.codeforcesUsername ?? r.user?.codeforcesUsername ?? "",
            group: r.group ?? null,
            rank: r.rank ?? 0,
            score: r.score ?? 0,
            solved: r.solved ?? 0,
            penalty: r.penalty ?? 0,
            status: r.status ?? "ACTIVE",
            currentStage: r.currentStage ?? null,
          }));

        setStandings(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load standings");
      }
    },
    [token],
  );

  // ---- Load on tournament change -------------------------------------
  useEffect(() => {
    if (!tournamentId) {
      setStandings([]);
      setGroups([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setGroup(null);

    Promise.all([loadGroups(tournamentId), loadStandings(tournamentId)])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId, loadGroups, loadStandings]);

  // ---- Handlers ------------------------------------------------------
  const handleGroupChange = (selectedGroup: string | null) => {
    setGroup(selectedGroup);
    if (tournamentId) loadStandings(tournamentId, selectedGroup);
  };

  const handleRefresh = async () => {
    if (!tournamentId) return;
    setRefreshing(true);
    await Promise.all([loadGroups(tournamentId), loadStandings(tournamentId, group)]);
    setRefreshing(false);
  };

  // ---- Stats (derived) -----------------------------------------------
  const totalParticipants = standings.length;
  const totalSolved = standings.reduce((sum, s) => sum + (s.solved || 0), 0);
  const totalScore = standings.reduce((sum, s) => sum + (s.score || 0), 0);
  const activeCount = standings.filter((s) => s.status !== "ELIMINATED").length;

  // ---- Empty: no tournament selected --------------------------------
  if (!tournamentId) {
    return (
      <div
        style={{
          padding: "24px",
          borderRadius: c.radius.lg,
          background: "rgba(255, 215, 0, 0.06)",
          border: `1px solid ${c.border.gold}`,
          color: c.accent.gold,
          fontSize: "14px",
        }}
      >
        No tournament selected. Please select a tournament from the sidebar to view standings.
      </div>
    );
  }

  // ---- Loading -------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          color: c.text.muted,
        }}
      >
        Loading standings...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        paddingBottom: "40px",
      }}
    >
      {/* ---- Header ---- */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: c.radius.lg,
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06))",
          border: `1px solid ${c.border.subtle}`,
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 215, 0, 0.1), transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: c.radius.md,
                background: "linear-gradient(135deg, #FFD700, #FFA000)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(255, 215, 0, 0.3)",
                flexShrink: 0,
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(255, 215, 0, 0.75)",
                  marginBottom: "2px",
                }}
              >
                Tournament Standings
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #90CAF9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {selectedTournament?.name || "Standings"}
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {totalParticipants} participants · {activeCount} active
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: c.radius.md,
              background: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${c.border.mid}`,
              color: c.text.primary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: refreshing ? "wait" : "pointer",
              opacity: refreshing ? 0.6 : 1,
              transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 0.9s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ---- Stats row ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <StatCard
          icon={<Users size={18} />}
          label="Participants"
          value={totalParticipants}
          tone="blue"
        />
        <StatCard icon={<Target size={18} />} label="Active" value={activeCount} tone="green" />
        <StatCard
          icon={<Zap size={18} />}
          label="Problems Solved"
          value={totalSolved}
          tone="purple"
        />
        <StatCard icon={<Trophy size={18} />} label="Total Score" value={totalScore} tone="gold" />
      </div>

      {/* ---- Group filter ---- */}
      {groups.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            padding: "12px 16px",
            borderRadius: c.radius.md,
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: c.text.muted,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              marginRight: "4px",
            }}
          >
            <Filter size={14} />
            Group
          </div>

          <FilterChip label="All" active={group === null} onClick={() => handleGroupChange(null)} />
          {groups.map((g) => (
            <FilterChip
              key={g}
              label={`Group ${g}`}
              active={group === g}
              color={getGroupColor(g)}
              onClick={() => handleGroupChange(g)}
            />
          ))}
        </div>
      )}

      {/* ---- Error ---- */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: c.radius.md,
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: c.accent.red,
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* ---- Table ---- */}
      {standings.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: "16px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.mid}`,
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(255, 215, 0, 0.06)",
              border: "1px solid rgba(255, 215, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.accent.gold,
              marginBottom: "8px",
            }}
          >
            <TrendingUp size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: c.text.secondary,
              margin: 0,
            }}
          >
            No standings yet
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: c.text.muted,
              margin: 0,
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            {group
              ? `No participants in Group ${group} have results yet.`
              : "Standings will appear here once contests are synced and results are recorded."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
            borderRadius: c.radius.lg,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ background: c.bg.header }}>
                  <Th>Rank</Th>
                  <Th>Participant</Th>
                  <Th align="center">Group</Th>
                  <Th align="center">Solved</Th>
                  <Th align="center">Penalty</Th>
                  <Th align="center">Score</Th>
                  <Th align="center">Status</Th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => {
                  const isTop3 = standing.rank <= 3;
                  const medalColor = getMedalColor(standing.rank);
                  const statusTone = getStatusTone(standing.status);

                  return (
                    <tr
                      key={standing.participantId}
                      style={{
                        background: index === 0 ? c.bg.rowHighlight : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (index !== 0) {
                          e.currentTarget.style.background = c.bg.rowHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (index !== 0) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {/* Rank */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          width: "80px",
                        }}
                      >
                        {isTop3 ? (
                          <div
                            style={{
                              position: "relative",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${medalColor}, ${medalColor}cc)`,
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "14px",
                              boxShadow: `0 6px 16px ${medalColor}40`,
                            }}
                          >
                            {standing.rank === 1 && (
                              <Crown
                                size={12}
                                style={{
                                  position: "absolute",
                                  top: "-8px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  color: medalColor,
                                  filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))",
                                }}
                              />
                            )}
                            {standing.rank}
                          </div>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.04)",
                              color: c.text.secondary,
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {standing.rank}
                          </span>
                        )}
                      </td>

                      {/* Participant */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: c.radius.sm,
                              background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {(standing.username || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: c.text.primary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {standing.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: c.text.muted,
                              }}
                            >
                              @{standing.username}
                              {standing.codeforcesUsername && (
                                <span
                                  style={{
                                    marginLeft: "8px",
                                    color: c.text.faint,
                                  }}
                                >
                                  · {standing.codeforcesUsername}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          textAlign: "center",
                        }}
                      >
                        {standing.group ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "28px",
                              padding: "3px 10px",
                              borderRadius: "6px",
                              background: `${getGroupColor(standing.group)}20`,
                              border: `1px solid ${getGroupColor(standing.group)}40`,
                              color: getGroupColor(standing.group),
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {standing.group}
                          </span>
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      {/* Solved */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 12px",
                            borderRadius: "999px",
                            background: "rgba(76, 175, 80, 0.1)",
                            color: c.accent.green,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          <Zap size={12} />
                          {standing.solved}
                        </span>
                      </td>

                      {/* Penalty */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          textAlign: "center",
                          color: c.text.secondary,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {standing.penalty}
                      </td>

                      {/* Score */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "52px",
                            padding: "3px 12px",
                            borderRadius: "6px",
                            background: "rgba(156, 39, 176, 0.1)",
                            color: c.accent.purple,
                            fontSize: "14px",
                            fontWeight: 800,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {standing.score}
                        </span>
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: "14px 20px",
                          borderTop: `1px solid ${c.border.subtle}`,
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            background: statusTone.bg,
                            border: `1px solid ${statusTone.border}`,
                            color: statusTone.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: statusTone.color,
                              boxShadow: `0 0 6px ${statusTone.color}`,
                            }}
                          />
                          {standing.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyframes for the spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ---- Small helper components -----------------------------------------

interface ThProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

const Th: React.FC<ThProps> = ({ children, align = "left" }) => (
  <th
    style={{
      padding: "14px 20px",
      textAlign: align,
      fontSize: "11px",
      fontWeight: 700,
      color: "rgba(255, 255, 255, 0.4)",
      textTransform: "uppercase",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "purple" | "gold";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, tone }) => {
  const tones = {
    blue: { color: c.accent.blue, bg: "rgba(100, 181, 246, 0.1)" },
    green: { color: c.accent.green, bg: "rgba(76, 175, 80, 0.1)" },
    purple: { color: c.accent.purple, bg: "rgba(156, 39, 176, 0.1)" },
    gold: { color: c.accent.gold, bg: "rgba(255, 215, 0, 0.1)" },
  }[tone];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px 20px",
        background: c.bg.card,
        border: `1px solid ${c.border.subtle}`,
        borderRadius: c.radius.md,
        transition: "transform 0.2s ease, background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = c.bg.cardHover;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = c.bg.card;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: c.radius.sm,
          background: tones.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: tones.color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: c.text.muted,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: c.text.primary,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

interface FilterChipProps {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, color, onClick }) => {
  const activeColor = color ?? "#2979FF";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "999px",
        border: `1px solid ${active ? activeColor : "rgba(255, 255, 255, 0.08)"}`,
        background: active ? `${activeColor}1a` : "rgba(255, 255, 255, 0.03)",
        color: active ? activeColor : "rgba(255, 255, 255, 0.6)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {color && (
        <span
          aria-hidden="true"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: active ? activeColor : "rgba(255, 255, 255, 0.2)",
          }}
        />
      )}
      {label}
    </button>
  );
};

export default AdminStandings;
