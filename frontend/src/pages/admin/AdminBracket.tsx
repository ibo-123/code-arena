import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui";
import {
  Trophy,
  Users,
  ArrowRight,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Bracket, BracketMatch, Participant, Tournament } from "../../types";

export const AdminBracket = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedStages, setExpandedStages] = useState<string[]>([
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "FINAL",
  ]);

  useEffect(() => {
    let isMounted = true;
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null;
        if (isMounted) setTournament(t);
        if (t) {
          return tournamentApi.bracket(t._id);
        }
        return { bracket: {} as Bracket };
      })
      .then(({ bracket: data }) => {
        if (isMounted) setBracket(data);
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

  const reloadBracket = () => {
    if (!tournament) return;
    tournamentApi
      .bracket(tournament._id)
      .then(({ bracket: data }) => setBracket(data))
      .catch((err: Error) => setError(err.message));
  };

  const advanceStage = async (
    stage: "group-stage" | "quarter-final" | "semi-final" | "complete",
  ) => {
    if (!tournament) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await tournamentApi.advance(tournament._id, stage);
      setNotice(`Stage '${stage}' processed successfully.`);
      reloadBracket();
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

  if (loading)
    return <LoadingState label="Loading tournament seeding & bracket..." />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <EmptyState label="No active tournament found." />;

  const isCompleted = tournament.status === "COMPLETED";

  const advanceOptions = [
    {
      stage: "GROUP_STAGE",
      label: "Advance Group Stage (Top 8 to QF)",
      action: "group-stage",
      currentRound: "GROUP_STAGE",
      icon: <Users size={18} />,
    },
    {
      stage: "QUARTER_FINAL",
      label: "Advance Quarter Finals to Semi Finals",
      action: "quarter-final",
      currentRound: "QUARTER_FINAL",
      icon: <Medal size={18} />,
    },
    {
      stage: "SEMI_FINAL",
      label: "Advance Semi Finals to Grand Final",
      action: "semi-final",
      currentRound: "SEMI_FINAL",
      icon: <Trophy size={18} />,
    },
    {
      stage: "FINAL",
      label: "Crown Champion & Finish Tournament",
      action: "complete",
      currentRound: "FINAL",
      icon: <Crown size={18} />,
    },
  ];

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.currentRound === tournament.currentRound,
  );

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
            Seeding & Bracket Management
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Tournament Seeding & Playoffs
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Badge tone={isCompleted ? "gold" : "blue"}>
            {tournament.currentRound || tournament.status}
          </Badge>
          <button
            onClick={reloadBracket}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>
      </header>

      {notice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            color: "#4CAF50",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            color: "#FF6B6B",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {!isCompleted && currentAdvanceOption && (
        <Card
          style={{
            padding: "24px",
            background: "rgba(255,215,0,0.03)",
            border: "1px solid rgba(255,215,0,0.15)",
            borderRadius: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
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
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(255,215,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentAdvanceOption.icon}
              </div>
              <div>
                <small
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Next Stage
                </small>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  {currentAdvanceOption.label}
                </div>
              </div>
            </div>
            <button
              disabled={busy}
              onClick={() => advanceStage(currentAdvanceOption.action as "group-stage" | "quarter-final" | "semi-final" | "complete")}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                background: busy
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #FFD700, #FFA000)",
                border: "none",
                color: busy ? "rgba(255,255,255,0.4)" : "#0a0e1a",
                fontWeight: "700",
                fontSize: "14px",
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
              }}
            >
              {busy ? "Processing..." : "Advance Stage"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </div>
        </Card>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Group Stage - Fix: groupStage is a 2D array */}
        <StageSection
          title="Group Stage"
          stage="GROUP_STAGE"
          icon={Users}
          color="#4CAF50"
          isExpanded={expandedStages.includes("GROUP_STAGE")}
          onToggle={() => toggleStage("GROUP_STAGE")}
        >
          {bracket?.groupStage &&
          Object.keys(bracket.groupStage).length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {(Object.entries(bracket.groupStage) as [string, Participant[]][]).map(
                ([groupKey, group]: [string, Participant[]], idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#4CAF50",
                        marginBottom: "8px",
                      }}
                    >
                      Group {groupKey}
                    </div>
                    {group.map((participant: Participant) => (
                      <div
                        key={participant._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 0",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.8)",
                          borderBottom: "1px solid rgba(255,255,255,0.02)",
                        }}
                      >
                        <span>{participant.user?.username || "Unknown"}</span>
                        <span style={{ color: "#FFD700" }}>
                          #{participant.rank || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState label="No group stage data available" />
          )}
        </StageSection>

        {/* Quarter Finals */}
        <StageSection
          title="Quarter Finals"
          stage="QUARTER_FINAL"
          icon={Medal}
          color="#FF9800"
          isExpanded={expandedStages.includes("QUARTER_FINAL")}
          onToggle={() => toggleStage("QUARTER_FINAL")}
        >
          {bracket?.quarterFinal && bracket.quarterFinal.length > 0 ? (
            bracket.quarterFinal.map((match) => (
              <MatchCard key={match.matchNumber} match={match} />
            ))
          ) : (
            <EmptyState label="QF matchups pending" />
          )}
        </StageSection>

        {/* Semi Finals */}
        <StageSection
          title="Semi Finals"
          stage="SEMI_FINAL"
          icon={Trophy}
          color="#9C27B0"
          isExpanded={expandedStages.includes("SEMI_FINAL")}
          onToggle={() => toggleStage("SEMI_FINAL")}
        >
          {bracket?.semiFinal && bracket.semiFinal.length > 0 ? (
            bracket.semiFinal.map((match) => (
              <MatchCard key={match.matchNumber} match={match} />
            ))
          ) : (
            <EmptyState label="SF matchups pending" />
          )}
        </StageSection>

        {/* Grand Final */}
        <StageSection
          title="Grand Final"
          stage="FINAL"
          icon={Crown}
          color="#FFD700"
          isExpanded={expandedStages.includes("FINAL")}
          onToggle={() => toggleStage("FINAL")}
        >
          {bracket?.final ? (
            <MatchCard match={bracket.final} isFinal />
          ) : (
            <EmptyState label="Final match pending" />
          )}
        </StageSection>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .match-card {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
};

interface StageSectionProps {
  title: string;
  stage: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StageSection: React.FC<StageSectionProps> = ({
  title,
  icon: Icon,
  color,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <Card
      style={{
        padding: "0",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderBottom: isExpanded
            ? "1px solid rgba(255,255,255,0.06)"
            : "none",
          transition: "all 0.3s ease",
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
              borderRadius: "10px",
              background: `${color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={color} />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "white",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Click to {isExpanded ? "collapse" : "expand"}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} color="rgba(255,255,255,0.3)" />
        ) : (
          <ChevronDown size={20} color="rgba(255,255,255,0.3)" />
        )}
      </div>
      {isExpanded && (
        <div
          style={{
            padding: "16px 20px",
          }}
        >
          {children}
        </div>
      )}
    </Card>
  );
};

interface MatchCardProps {
  match: BracketMatch;
  isFinal?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isFinal }) => {
  const hasWinner = match.winner;

  return (
    <div
      className="match-card"
      style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "10px",
        border: isFinal
          ? "1px solid rgba(255,215,0,0.2)"
          : "1px solid rgba(255,255,255,0.04)",
        marginBottom: "8px",
        position: "relative",
      }}
    >
      {isFinal && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "12px",
            padding: "2px 12px",
            borderRadius: "100px",
            background: "linear-gradient(135deg, #FFD700, #FFA000)",
            fontSize: "9px",
            fontWeight: "700",
            color: "#0a0e1a",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Final
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <small
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Match {match.matchNumber || "1"}
        </small>
        {hasWinner && (
          <Badge tone="gold">
            <CheckCircle size={10} style={{ marginRight: "4px" }} />
            Winner Decided
          </Badge>
        )}
      </div>
      {match.participants &&
        match.participants.map((p: Participant) => {
          const isWinner = match.winner?._id === p._id;
          return (
            <div
              key={p._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px",
                borderRadius: "6px",
                background: isWinner ? "rgba(255,215,0,0.05)" : "transparent",
                border: isWinner ? "1px solid rgba(255,215,0,0.1)" : "none",
                marginBottom: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: isWinner ? "#FFD700" : "rgba(255,255,255,0.7)",
                  fontWeight: isWinner ? "600" : "400",
                }}
              >
                {p.user?.username || "Unknown"}
              </span>
              {isWinner && (
                <Crown
                  size={14}
                  color="#FFD700"
                  style={{ marginLeft: "auto" }}
                />
              )}
            </div>
          );
        })}
    </div>
  );
};

export default AdminBracket;
