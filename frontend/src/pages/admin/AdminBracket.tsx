import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";
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
import type { Bracket, BracketMatch, Participant } from "../../types";

export const AdminBracket = () => {
  const { selectedTournament, refreshTournaments } = useAdmin();
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
    if (selectedTournament) {
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

  const reloadBracket = () => {
    if (!selectedTournament) return;
    tournamentApi
      .bracket(selectedTournament._id)
      .then(({ bracket: data }) => setBracket(data))
      .catch((err: Error) => setError(err.message));
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
      reloadBracket();
      await refreshTournaments();
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

  if (loading) return <LoadingState label="Loading tournament seeding & bracket..." />;
  if (error) return <ErrorState error={error} />;
  if (!selectedTournament) return <EmptyState label="No tournament selected." />;

  const isCompleted = selectedTournament.status === "COMPLETED";
  const hasBracketData =
    bracket &&
    (bracket.quarterFinal?.length > 0 ||
      bracket.semiFinal?.length > 0 ||
      bracket.final ||
      Object.keys(bracket.groupStage || {}).length > 0);

  const advanceOptions = [
    {
      stage: "GROUP_STAGE",
      label: "Advance Group Stage (Top 8 to QF)",
      action: "group-stage" as const,
      currentStage: "GROUP_STAGE",
      icon: <Users size={18} />,
    },
    {
      stage: "QUARTER_FINAL",
      label: "Advance Quarter Finals to Semi Finals",
      action: "quarter-final" as const,
      currentStage: "QUARTER_FINAL",
      icon: <Medal size={18} />,
    },
    {
      stage: "SEMI_FINAL",
      label: "Advance Semi Finals to Grand Final",
      action: "semi-final" as const,
      currentStage: "SEMI_FINAL",
      icon: <Trophy size={18} />,
    },
    {
      stage: "FINAL",
      label: "Crown Champion & Finish Tournament",
      action: "complete" as const,
      currentStage: "FINAL",
      icon: <Crown size={18} />,
    },
  ];

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.currentStage === selectedTournament.currentStage,
  );

  // Helper function to render match card
  const renderMatch = (match: BracketMatch) => (
    <div
      key={`${match.matchNumber}-${match.participants?.[0]?._id || "unknown"}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: "12px",
        width: "100%",
        maxWidth: "320px",
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
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>
          Match {match.matchNumber}
        </span>
        <Badge
          tone={match.status === "COMPLETED" ? "green" : match.status === "LIVE" ? "red" : "muted"}
        >
          {match.status || "PENDING"}
        </Badge>
      </div>

      {match.participants?.map((p: Participant) => {
        const isWinner = match.winner?._id === p._id;
        return (
          <div
            key={p._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 10px",
              marginBottom: "4px",
              borderRadius: "6px",
              background: isWinner ? "rgba(255,215,0,0.08)" : "transparent",
              border: isWinner ? "1px solid rgba(255,215,0,0.2)" : "1px solid transparent",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "13px",
                fontWeight: isWinner ? "600" : "400",
                color: isWinner ? "#FFD700" : "rgba(255,255,255,0.8)",
              }}
            >
              {p.user?.username || "Unknown"}
            </span>
            {isWinner && <Crown size={14} color="#FFD700" />}
          </div>
        );
      })}
    </div>
  );

  // Helper function to render group stage
  const renderGroupStage = () => {
    if (!bracket?.groupStage || Object.keys(bracket.groupStage).length === 0) {
      return <EmptyState label="Group stage not yet drawn" />;
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {Object.entries(bracket.groupStage).map(([groupName, participants]) => (
          <div
            key={groupName}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              padding: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#64B5F6",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Group {groupName}</span>
              <Badge tone="muted">{participants.length}</Badge>
            </div>
            {participants.map((p) => (
              <div
                key={p._id}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  color: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontWeight: "600", color: "rgba(255,255,255,0.3)" }}>#{p.seed}</span>
                {p.user?.username || "Unknown"}
                <Badge tone={p.status === "ELIMINATED" ? "muted" : "green"}>
                  {p.status || "ACTIVE"}
                </Badge>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
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
            Tournament Bracket
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Bracket Management
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            {selectedTournament.name} · {selectedTournament.status || "DRAFT"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Badge tone={isCompleted ? "gold" : "blue"}>
            {isCompleted ? "COMPLETED" : selectedTournament.currentStage || "REGISTRATION"}
          </Badge>

          <button
            onClick={reloadBracket}
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
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            borderRadius: "12px",
            color: "#FF6B6B",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            borderRadius: "12px",
            color: "#4CAF50",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle size={20} />
          {notice}
        </div>
      )}

      {/* Bracket Content */}
      {!hasBracketData ? (
        <Card style={{ padding: "40px", textAlign: "center" }}>
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
          <h3 style={{ color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>
            No Bracket Data Available
          </h3>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            Start the tournament to generate groups and bracket matches.
          </p>
        </Card>
      ) : (
        <>
          {/* Group Stage */}
          <Card
            style={{
              padding: "20px",
              marginBottom: "24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "4px 0",
              }}
              onClick={() => toggleStage("GROUP_STAGE")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Users size={20} color="#64B5F6" />
                <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Group Stage</h3>
                <Badge tone="muted">
                  {bracket?.groupStage ? Object.keys(bracket.groupStage).length : 0} Groups
                </Badge>
              </div>
              {expandedStages.includes("GROUP_STAGE") ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
            {expandedStages.includes("GROUP_STAGE") && (
              <div style={{ marginTop: "16px" }}>{renderGroupStage()}</div>
            )}
          </Card>

          {/* Quarter Finals */}
          {bracket?.quarterFinal && bracket.quarterFinal.length > 0 && (
            <Card
              style={{
                padding: "20px",
                marginBottom: "24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
                onClick={() => toggleStage("QUARTER_FINAL")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Medal size={20} color="#FF9800" />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Quarter Finals</h3>
                  <Badge tone="muted">{bracket.quarterFinal.length} Matches</Badge>
                </div>
                {expandedStages.includes("QUARTER_FINAL") ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedStages.includes("QUARTER_FINAL") && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {bracket.quarterFinal.map(renderMatch)}
                </div>
              )}
            </Card>
          )}

          {/* Semi Finals */}
          {bracket?.semiFinal && bracket.semiFinal.length > 0 && (
            <Card
              style={{
                padding: "20px",
                marginBottom: "24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
                onClick={() => toggleStage("SEMI_FINAL")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Trophy size={20} color="#9C27B0" />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Semi Finals</h3>
                  <Badge tone="muted">{bracket.semiFinal.length} Matches</Badge>
                </div>
                {expandedStages.includes("SEMI_FINAL") ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedStages.includes("SEMI_FINAL") && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {bracket.semiFinal.map(renderMatch)}
                </div>
              )}
            </Card>
          )}

          {/* Final */}
          {bracket?.final && (
            <Card
              style={{
                padding: "20px",
                marginBottom: "24px",
                background: "rgba(255,215,0,0.03)",
                border: "1px solid rgba(255,215,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
                onClick={() => toggleStage("FINAL")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Crown size={20} color="#FFD700" />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#FFD700" }}>
                    Grand Final
                  </h3>
                  <Badge tone="gold">Championship Match</Badge>
                </div>
                {expandedStages.includes("FINAL") ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedStages.includes("FINAL") && (
                <div style={{ marginTop: "16px", maxWidth: "400px" }}>
                  {renderMatch(bracket.final)}

                  {/* Champion Display */}
                  {bracket.champion && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "rgba(255,215,0,0.08)",
                        border: "1px solid rgba(255,215,0,0.15)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        🏆 Champion
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFD700" }}>
                        {bracket.champion.user?.username || "Unknown"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Advance Controls */}
      {!isCompleted && currentAdvanceOption && (
        <Card
          style={{
            padding: "20px 24px",
            marginTop: "16px",
            background: "rgba(41,121,255,0.03)",
            border: "1px solid rgba(41,121,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowRight size={18} color="#2979FF" />
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#2979FF" }}>
                Next Action:
              </span>
            </div>
            <button
              disabled={busy}
              onClick={() => advanceStage(currentAdvanceOption.action)}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: busy
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #2979FF, #1565C0)",
                border: "none",
                color: busy ? "rgba(255,255,255,0.4)" : "white",
                fontWeight: "600",
                fontSize: "14px",
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentAdvanceOption.icon}
                  {currentAdvanceOption.label}
                </>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Completed State */}
      {isCompleted && bracket?.champion && (
        <Card
          style={{
            padding: "24px",
            marginTop: "16px",
            background: "rgba(255,215,0,0.05)",
            border: "1px solid rgba(255,215,0,0.15)",
            textAlign: "center",
          }}
        >
          <Crown size={48} color="#FFD700" style={{ marginBottom: "12px" }} />
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFD700", margin: "0" }}>
            Tournament Complete!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", marginTop: "8px" }}>
            Champion:{" "}
            <strong style={{ color: "#FFD700" }}>
              {bracket.champion.user?.username || "Unknown"}
            </strong>
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminBracket;
