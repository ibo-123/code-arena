import { useEffect, useState } from "react";
import { Badge, EmptyState, LoadingState } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";
import {
  Trophy,
  Users,
  ArrowRight,
  Crown,
  Medal,
  RefreshCw,
  Swords,
  GitBranch,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Bracket, BracketMatch, Participant } from "../../types";
import {
  Button,
  Alert,
  AdminCard,
  CollapsibleSection,
  AdminEmptyState,
  globalStyles,
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";

// ---- Helpers -----------------------------------------------------------

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

const getMatchStatusTone = (
  status?: string,
): { color: string; bg: string; border: string; pulse: boolean } => {
  const s = (status || "").toUpperCase();
  if (s === "LIVE" || s === "ONGOING") {
    return {
      color: "#EF5350",
      bg: "rgba(239, 83, 80, 0.12)",
      border: "rgba(239, 83, 80, 0.35)",
      pulse: true,
    };
  }
  if (s === "COMPLETED" || s === "FINISHED") {
    return {
      color: "#4CAF50",
      bg: "rgba(76, 175, 80, 0.12)",
      border: "rgba(76, 175, 80, 0.25)",
      pulse: false,
    };
  }
  return {
    color: "rgba(255, 255, 255, 0.5)",
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    pulse: false,
  };
};

export const AdminBracket = () => {
  const { selectedTournament, refreshTournaments } = useAdmin();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedStages, setExpandedStages] = useState<string[]>([
    "GROUP_STAGE",
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "FINAL",
  ]);

  useEffect(() => {
    let isMounted = true;
    if (selectedTournament) {
      setLoading(true);
      tournamentApi
        .bracket(selectedTournament._id)
        .then(({ bracket: data }) => {
          if (isMounted) setBracket(data);
        })
        .catch((err: Error) => {
          if (isMounted) setError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedTournament]);

  const reloadBracket = async () => {
    if (!selectedTournament) return;
    setRefreshing(true);
    try {
      const { bracket: data } = await tournamentApi.bracket(selectedTournament._id);
      setBracket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload bracket");
    } finally {
      setRefreshing(false);
    }
  };

  const advanceStage = async (
    stage: "group-stage" | "quarter-final" | "semi-final" | "complete",
  ) => {
    if (!selectedTournament) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await tournamentApi.advance(selectedTournament._id, stage);
      setNotice(`Stage '${stage}' processed successfully.`);
      await reloadBracket();
      await refreshTournaments();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Advancement failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };

  if (loading) {
    return <LoadingState label="Loading tournament seeding & bracket..." />;
  }
  if (!selectedTournament) {
    return <EmptyState label="No tournament selected." />;
  }

  const isCompleted = selectedTournament.status === "COMPLETED";
  const hasBracketData =
    bracket &&
    ((bracket.quarterFinal?.length ?? 0) > 0 ||
      (bracket.semiFinal?.length ?? 0) > 0 ||
      !!bracket.final ||
      Object.keys(bracket.groupStage || {}).length > 0);

  const advanceOptions = [
    {
      stage: "GROUP_STAGE",
      label: "Advance Group Stage",
      sublabel: "Top 8 → Quarter Finals",
      action: "group-stage" as const,
      currentStage: "GROUP_STAGE",
      icon: <Users size={18} />,
      gradient: tokens.gradients.orange,
    },
    {
      stage: "QUARTER_FINAL",
      label: "Advance Quarter Finals",
      sublabel: "Winners → Semi Finals",
      action: "quarter-final" as const,
      currentStage: "QUARTER_FINAL",
      icon: <Medal size={18} />,
      gradient: tokens.gradients.purple,
    },
    {
      stage: "SEMI_FINAL",
      label: "Advance Semi Finals",
      sublabel: "Winners → Grand Final",
      action: "semi-final" as const,
      currentStage: "SEMI_FINAL",
      icon: <Trophy size={18} />,
      gradient: tokens.gradients.pink,
    },
    {
      stage: "FINAL",
      label: "Crown Champion",
      sublabel: "Finish the tournament",
      action: "complete" as const,
      currentStage: "FINAL",
      icon: <Crown size={18} />,
      gradient: tokens.gradients.gold,
    },
  ];

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.currentStage === selectedTournament.currentStage,
  );

  // ---- Stats (derived) ------------------------------------------------
  const groupCount = bracket?.groupStage ? Object.keys(bracket.groupStage).length : 0;
  const qfCount = bracket?.quarterFinal?.length ?? 0;
  const sfCount = bracket?.semiFinal?.length ?? 0;
  const hasFinal = !!bracket?.final;

  // ---------- Match Card ----------
  const renderMatch = (match: BracketMatch) => {
    const tone = getMatchStatusTone(match.status);

    return (
      <div
        key={`${match.matchNumber}-${match.participants?.[0]?._id || "unknown"}`}
        style={{
          position: "relative",
          background: tokens.colors.bg.card,
          borderRadius: tokens.radius.lg,
          padding: "14px 16px",
          border: `1px solid ${tone.pulse ? tone.border : tokens.colors.border.subtle}`,
          width: "100%",
          maxWidth: "320px",
          transition: "border-color 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Match header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 700,
              color: tokens.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <Swords size={12} />
            Match {match.matchNumber}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "999px",
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              color: tone.color,
              fontSize: "10px",
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
                background: tone.color,
                boxShadow: tone.pulse ? `0 0 6px ${tone.color}` : "none",
                animation: tone.pulse ? "bracketPulse 1.5s infinite" : "none",
              }}
            />
            {match.status || "PENDING"}
          </div>
        </div>

        {/* Participants */}
        {match.participants?.map((p: Participant, idx: number) => {
          const isWinner = match.winner?._id === p._id;
          const isLast = idx === (match.participants?.length ?? 0) - 1;

          return (
            <div key={p._id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: tokens.radius.sm,
                  background: isWinner ? "rgba(255, 215, 0, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: isWinner ? "1px solid rgba(255, 215, 0, 0.25)" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: isWinner
                      ? "linear-gradient(135deg, #FFD700, #FFA000)"
                      : "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isWinner ? "#fff" : tokens.colors.text.muted,
                    flexShrink: 0,
                  }}
                >
                  {(p.user?.username || "?").charAt(0).toUpperCase()}
                </div>

                <span
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: isWinner ? 700 : 500,
                    color: isWinner ? tokens.colors.accent.gold : tokens.colors.text.secondary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.user?.username || "Unknown"}
                </span>

                {isWinner && <Crown size={14} color={tokens.colors.accent.gold} />}
              </div>

              {!isLast && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "2px 10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: tokens.colors.text.faint,
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    }}
                  />
                  VS
                  <span
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- Group Stage ----------
  const renderGroupStage = () => {
    if (!bracket?.groupStage || Object.keys(bracket.groupStage).length === 0) {
      return <EmptyState label="Group stage not yet drawn" />;
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {Object.entries(bracket.groupStage).map(([groupName, participants]) => {
          const groupColor = getGroupColor(groupName);
          return (
            <div
              key={groupName}
              style={{
                background: tokens.colors.bg.card,
                borderRadius: tokens.radius.md,
                overflow: "hidden",
                border: `1px solid ${tokens.colors.border.subtle}`,
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Group header */}
              <div
                style={{
                  padding: "10px 14px",
                  background: `linear-gradient(135deg, ${groupColor}20, ${groupColor}08)`,
                  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${groupColor}, ${groupColor}cc)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 800,
                      boxShadow: `0 4px 12px ${groupColor}40`,
                    }}
                  >
                    {groupName}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: tokens.colors.text.primary,
                    }}
                  >
                    Group {groupName}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: groupColor,
                    background: `${groupColor}20`,
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {participants.length}
                </span>
              </div>

              {/* Participants */}
              <div style={{ padding: "8px" }}>
                {participants.map((p) => {
                  const isEliminated = p.status === "ELIMINATED";
                  return (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        borderRadius: tokens.radius.sm,
                        opacity: isEliminated ? 0.5 : 1,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.04)",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: tokens.colors.text.muted,
                          flexShrink: 0,
                        }}
                      >
                        #{p.seed}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          fontWeight: 500,
                          color: isEliminated
                            ? tokens.colors.text.faint
                            : tokens.colors.text.secondary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.user?.username || "Unknown"}
                      </span>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isEliminated ? tokens.colors.text.faint : "#4CAF50",
                          boxShadow: isEliminated ? "none" : "0 0 6px rgba(76,175,80,0.6)",
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ---- Header ---- */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: tokens.radius.lg,
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06))",
          border: `1px solid ${tokens.colors.border.subtle}`,
          overflow: "hidden",
          marginBottom: tokens.spacing.lg,
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
            background: "radial-gradient(circle, rgba(156, 39, 176, 0.15), transparent 70%)",
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
                borderRadius: tokens.radius.md,
                background: "linear-gradient(135deg, #9C27B0, #7B1FA2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(156, 39, 176, 0.35)",
                flexShrink: 0,
              }}
            >
              <GitBranch size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(156, 39, 176, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Tournament Bracket
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #CE93D8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Bracket Management
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "6px",
                  fontSize: "13px",
                  color: tokens.colors.text.muted,
                  flexWrap: "wrap",
                }}
              >
                <span>{selectedTournament.name}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <Badge tone={isCompleted ? "gold" : "blue"}>
                  {isCompleted ? "COMPLETED" : selectedTournament.currentStage || "REGISTRATION"}
                </Badge>
              </div>
            </div>
          </div>

          <Button onClick={reloadBracket} loading={refreshing} icon={<RefreshCw size={16} />}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
      {notice && <Alert type="success" message={notice} onDismiss={() => setNotice("")} />}

      {/* ---- Stats row ---- */}
      {hasBracketData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: tokens.spacing.lg,
          }}
        >
          <BracketStat
            icon={<Users size={18} />}
            label="Groups"
            value={groupCount}
            color="#4CAF50"
          />
          <BracketStat
            icon={<Medal size={18} />}
            label="Quarter Finals"
            value={qfCount}
            color="#FF9800"
          />
          <BracketStat
            icon={<Trophy size={18} />}
            label="Semi Finals"
            value={sfCount}
            color="#9C27B0"
          />
          <BracketStat
            icon={<Crown size={18} />}
            label="Grand Final"
            value={hasFinal ? 1 : 0}
            color="#FFD700"
          />
        </div>
      )}

      {!hasBracketData ? (
        <AdminEmptyState
          icon={<Trophy size={40} color="rgba(255,215,0,0.2)" />}
          title="No Bracket Data Available"
          description="Start the tournament to generate groups and bracket matches."
        />
      ) : (
        <>
          {/* Group Stage */}
          <CollapsibleSection
            title="Group Stage"
            icon={<Users size={20} color={tokens.colors.accent.blueLight} />}
            badge={<Badge tone="muted">{groupCount} Groups</Badge>}
            expanded={expandedStages.includes("GROUP_STAGE")}
            onToggle={() => toggleStage("GROUP_STAGE")}
          >
            {renderGroupStage()}
          </CollapsibleSection>

          {/* Quarter Finals */}
          {bracket?.quarterFinal && bracket.quarterFinal.length > 0 && (
            <CollapsibleSection
              title="Quarter Finals"
              icon={<Medal size={20} color={tokens.colors.accent.orange} />}
              badge={<Badge tone="muted">{bracket.quarterFinal.length} Matches</Badge>}
              expanded={expandedStages.includes("QUARTER_FINAL")}
              onToggle={() => toggleStage("QUARTER_FINAL")}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}
              >
                {bracket.quarterFinal.map(renderMatch)}
              </div>
            </CollapsibleSection>
          )}

          {/* Semi Finals */}
          {bracket?.semiFinal && bracket.semiFinal.length > 0 && (
            <CollapsibleSection
              title="Semi Finals"
              icon={<Trophy size={20} color={tokens.colors.accent.purple} />}
              badge={<Badge tone="muted">{bracket.semiFinal.length} Matches</Badge>}
              expanded={expandedStages.includes("SEMI_FINAL")}
              onToggle={() => toggleStage("SEMI_FINAL")}
              variant="purple"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}
              >
                {bracket.semiFinal.map(renderMatch)}
              </div>
            </CollapsibleSection>
          )}

          {/* Final */}
          {bracket?.final && (
            <CollapsibleSection
              title="Grand Final"
              icon={<Crown size={20} color={tokens.colors.accent.gold} />}
              badge={<Badge tone="gold">Championship Match</Badge>}
              expanded={expandedStages.includes("FINAL")}
              onToggle={() => toggleStage("FINAL")}
              variant="gold"
            >
              <div style={{ maxWidth: "400px" }}>
                {renderMatch(bracket.final)}

                {bracket.champion && (
                  <div
                    style={{
                      marginTop: tokens.spacing.md,
                      padding: "20px 24px",
                      borderRadius: tokens.radius.lg,
                      background:
                        "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))",
                      border: "1px solid rgba(255,215,0,0.25)",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Crown
                      size={28}
                      color={tokens.colors.accent.gold}
                      style={{
                        marginBottom: "8px",
                        filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color: tokens.colors.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        fontWeight: 700,
                        marginBottom: "4px",
                      }}
                    >
                      Champion
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: tokens.colors.accent.gold,
                      }}
                    >
                      {bracket.champion.user?.username || "Unknown"}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}

      {/* Advance Controls */}
      {!isCompleted && currentAdvanceOption && (
        <AdminCard variant="blue" padding="20px 24px" style={{ marginTop: tokens.spacing.md }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: tokens.radius.md,
                background: currentAdvanceOption.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {currentAdvanceOption.icon}
            </div>

            <div style={{ flex: 1, minWidth: "180px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: tokens.colors.accent.blue,
                  marginBottom: "2px",
                }}
              >
                Next Action
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: tokens.colors.text.primary,
                }}
              >
                {currentAdvanceOption.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: tokens.colors.text.muted,
                }}
              >
                {currentAdvanceOption.sublabel}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() => advanceStage(currentAdvanceOption.action)}
              icon={<ArrowRight size={18} />}
            >
              {busy ? "Processing..." : "Advance"}
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Completed State */}
      {isCompleted && bracket?.champion && (
        <AdminCard
          variant="gold"
          padding="32px 24px"
          style={{
            marginTop: tokens.spacing.md,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-50%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,215,0,0.15), transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Crown
              size={56}
              color={tokens.colors.accent.gold}
              style={{
                marginBottom: "12px",
                filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))",
              }}
            />
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: tokens.colors.accent.gold,
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Tournament Complete
            </h2>
            <p
              style={{
                color: tokens.colors.text.secondary,
                fontSize: "15px",
                margin: 0,
              }}
            >
              Champion crowned
            </p>
            <div
              style={{
                marginTop: "12px",
                fontSize: "22px",
                fontWeight: 800,
                color: tokens.colors.accent.gold,
              }}
            >
              {bracket.champion.user?.username || "Unknown"}
            </div>
          </div>
        </AdminCard>
      )}

      <style>{globalStyles}</style>
      <style>{`
        @keyframes bracketPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

// ---- Small helper -----------------------------------------------------

interface BracketStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const BracketStat: React.FC<BracketStatProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: tokens.radius.md,
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = tokens.colors.border.subtle;
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: tokens.radius.sm,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: tokens.colors.text.muted,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: tokens.colors.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default AdminBracket;
