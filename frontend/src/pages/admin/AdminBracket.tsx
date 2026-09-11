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
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Bracket, BracketMatch, Participant } from "../../types";
import {
  PageHeader,
  Button,
  Alert,
  AdminCard,
  CollapsibleSection,
  AdminEmptyState,
  globalStyles
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";
export const AdminBracket = () => {
  const { selectedTournament, refreshTournaments } = useAdmin();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  if (loading) return <LoadingState label="Loading tournament seeding & bracket..." />;
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
      gradient: tokens.gradients.orange,
    },
    {
      stage: "QUARTER_FINAL",
      label: "Advance Quarter Finals to Semi Finals",
      action: "quarter-final" as const,
      currentStage: "QUARTER_FINAL",
      icon: <Medal size={18} />,
      gradient: tokens.gradients.purple,
    },
    {
      stage: "SEMI_FINAL",
      label: "Advance Semi Finals to Grand Final",
      action: "semi-final" as const,
      currentStage: "SEMI_FINAL",
      icon: <Trophy size={18} />,
      gradient: tokens.gradients.pink,
    },
    {
      stage: "FINAL",
      label: "Crown Champion & Finish Tournament",
      action: "complete" as const,
      currentStage: "FINAL",
      icon: <Crown size={18} />,
      gradient: tokens.gradients.gold,
    },
  ];

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.currentStage === selectedTournament.currentStage,
  );

  // ---------- Match Card ----------
  const renderMatch = (match: BracketMatch) => (
    <div
      key={`${match.matchNumber}-${match.participants?.[0]?._id || "unknown"}`}
      style={{
        background: tokens.colors.bg.card,
        borderRadius: tokens.radius.lg,
        padding: "16px",
        border: `1px solid ${tokens.colors.border.subtle}`,
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
        <span style={{ fontSize: "12px", fontWeight: 600, color: tokens.colors.text.muted }}>
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
              borderRadius: tokens.radius.sm,
              background: isWinner ? "rgba(255,215,0,0.08)" : "transparent",
              border: isWinner ? "1px solid rgba(255,215,0,0.2)" : "1px solid transparent",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "13px",
                fontWeight: isWinner ? 600 : 400,
                color: isWinner ? tokens.colors.accent.gold : tokens.colors.text.secondary,
              }}
            >
              {p.user?.username || "Unknown"}
            </span>
            {isWinner && <Crown size={14} color={tokens.colors.accent.gold} />}
          </div>
        );
      })}
    </div>
  );

  // ---------- Group Stage ----------
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
              background: tokens.colors.bg.card,
              borderRadius: tokens.radius.md,
              padding: "12px",
              border: `1px solid ${tokens.colors.border.subtle}`,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: tokens.colors.accent.blueLight,
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
                  color: tokens.colors.text.secondary,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontWeight: 600, color: tokens.colors.text.faint }}>#{p.seed}</span>
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
      <PageHeader
        eyebrow="Tournament Bracket"
        title="Bracket Management"
        subtitle={`${selectedTournament.name} · ${selectedTournament.status || "DRAFT"}`}
        actions={
          <>
            <Badge tone={isCompleted ? "gold" : "blue"}>
              {isCompleted ? "COMPLETED" : selectedTournament.currentStage || "REGISTRATION"}
            </Badge>
            <Button onClick={reloadBracket} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
      {notice && <Alert type="success" message={notice} onDismiss={() => setNotice("")} />}

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
            badge={
              <Badge tone="muted">
                {bracket?.groupStage ? Object.keys(bracket.groupStage).length : 0} Groups
              </Badge>
            }
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
                      padding: "16px 20px",
                      borderRadius: tokens.radius.lg,
                      background: "rgba(255,215,0,0.08)",
                      border: "1px solid rgba(255,215,0,0.15)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: tokens.colors.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      🏆 Champion
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowRight size={18} color={tokens.colors.accent.blue} />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: tokens.colors.accent.blue,
                }}
              >
                Next Action:
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() => advanceStage(currentAdvanceOption.action)}
              icon={currentAdvanceOption.icon}
            >
              {busy ? "Processing..." : currentAdvanceOption.label}
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Completed State */}
      {isCompleted && bracket?.champion && (
        <AdminCard
          variant="gold"
          padding="24px"
          style={{ marginTop: tokens.spacing.md, textAlign: "center" }}
        >
          <Crown size={48} color={tokens.colors.accent.gold} style={{ marginBottom: "12px" }} />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: tokens.colors.accent.gold,
              margin: 0,
            }}
          >
            Tournament Complete!
          </h2>
          <p
            style={{
              color: tokens.colors.text.secondary,
              fontSize: "16px",
              marginTop: "8px",
            }}
          >
            Champion:{" "}
            <strong style={{ color: tokens.colors.accent.gold }}>
              {bracket.champion.user?.username || "Unknown"}
            </strong>
          </p>
        </AdminCard>
      )}

      <style>{globalStyles}</style>
    </div>
  );
};

export default AdminBracket;
