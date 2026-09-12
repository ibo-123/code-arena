import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trophy,
  Users,
  Save,
  Clock,
  Video,
  VideoOff,
} from "lucide-react";
import { LoadingState, ErrorState } from "../../components/ui";
import { apiClient } from "../../services/api";

interface RosterEntry {
  participantId: string;
  user?: {
    name?: string;
    username?: string;
    codeforcesUsername?: string;
  };
  group?: string;
  seed?: number;
  videoStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  isEligible: boolean;
  solved: number;
  penalty: number;
  rank: number | null;
  effectiveSolved: number;
  effectivePenalty: number;
}

interface ContestInfo {
  _id: string;
  name: string;
  stage: string;
  group?: string;
  status: string;
  startTime?: string;
  endTime?: string;
}

// ---- Design tokens ---------------------------------------------------
const c = {
  bg: { card: "rgba(255,255,255,0.02)" },
  border: { subtle: "rgba(255,255,255,0.06)", mid: "rgba(255,255,255,0.1)" },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.7)",
    muted: "rgba(255,255,255,0.5)",
    faint: "rgba(255,255,255,0.3)",
  },
  accent: {
    blue: "#64B5F6",
    green: "#4CAF50",
    red: "#EF5350",
    gold: "#FFD700",
    purple: "#CE93D8",
    orange: "#FF9800",
  },
  radius: { sm: "8px", md: "12px", lg: "16px" },
} as const;

const getVideoTone = (status: string) => {
  switch (status) {
    case "APPROVED":
      return { color: c.accent.green, label: "Approved", icon: <Video size={12} /> };
    case "PENDING":
      return { color: c.accent.gold, label: "Pending", icon: <Clock size={12} /> };
    case "REJECTED":
      return { color: c.accent.red, label: "Rejected", icon: <VideoOff size={12} /> };
    default:
      return { color: c.text.faint, label: "Not submitted", icon: <VideoOff size={12} /> };
  }
};

export const AdminContestResults = () => {
  const { contestId } = useParams<{ contestId: string }>();

  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Local edits keyed by participantId (admin can type before saving)
  const [edits, setEdits] = useState<Record<string, { solved: number; penalty: number }>>({});

  // Per-participant save state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // ---- Load ----------------------------------------------------------
  const load = useCallback(async () => {
    if (!contestId) return;
    try {
      setError("");
      const res = await apiClient.get(`/admin/contests/${contestId}/results`);
      setContest(res.data.contest);
      setRoster(res.data.roster || []);

      // Seed edits from current values
      const nextEdits: Record<string, { solved: number; penalty: number }> = {};
      for (const r of res.data.roster || []) {
        nextEdits[r.participantId] = { solved: r.solved, penalty: r.penalty };
      }
      setEdits(nextEdits);
      setSavedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ---- Edit handlers --------------------------------------------------
  const setEdit = (participantId: string, patch: Partial<{ solved: number; penalty: number }>) => {
    setEdits((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], ...patch },
    }));
    // If this participant was saved before, they now have unsaved changes
    setSavedIds((prev) => {
      if (!prev.has(participantId)) return prev;
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });
  };

  // ---- Save one participant ------------------------------------------
  const handleSave = async (participantId: string) => {
    if (!contestId) return;
    const edit = edits[participantId];
    if (!edit) return;

    setSavingId(participantId);
    setError("");
    try {
      await apiClient.post(`/admin/contests/${contestId}/results`, {
        participantId,
        solved: edit.solved,
        penalty: edit.penalty,
      });

      // Reload so ranks update
      const res = await apiClient.get(`/admin/contests/${contestId}/results`);
      setRoster(res.data.roster || []);

      // Re-seed edits from fresh data (keeps any unsaved edits on other rows)
      setEdits((prev) => {
        const next = { ...prev };
        for (const r of res.data.roster || []) {
          // Only overwrite the row we just saved
          if (r.participantId === participantId) {
            next[r.participantId] = { solved: r.solved, penalty: r.penalty };
          }
        }
        return next;
      });

      setSavedIds((prev) => new Set(prev).add(participantId));
      setNotice("Result saved");
      setTimeout(() => setNotice(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save result");
    } finally {
      setSavingId(null);
    }
  };

  // ---- Preview rank (client-side, live as you type) ------------------
  const previewRanks = useMemo(() => {
    const rows = roster.map((r) => {
      const edit = edits[r.participantId] || { solved: r.solved, penalty: r.penalty };
      const isEligible = r.isEligible;
      return {
        participantId: r.participantId,
        solved: isEligible ? edit.solved : 0,
        penalty: isEligible ? edit.penalty : 0,
        seed: r.seed ?? 9999,
      };
    });
    rows.sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;
      if (a.penalty !== b.penalty) return a.penalty - b.penalty;
      return a.seed - b.seed;
    });
    const ranks: Record<string, number> = {};
    rows.forEach((r, i) => {
      ranks[r.participantId] = i + 1;
    });
    return ranks;
  }, [roster, edits]);

  // ---- Derived stats --------------------------------------------------
  const eligibleCount = roster.filter((r) => r.isEligible).length;
  const notEligibleCount = roster.length - eligibleCount;
  const enteredCount = roster.filter((r) => savedIds.has(r.participantId)).length;

  if (loading) return <LoadingState label="Loading contest results..." />;
  if (error && !contest) return <ErrorState error={error} />;
  if (!contest) return <ErrorState error="Contest not found" />;

  const scopeLabel =
    contest.stage === "GROUP_STAGE" && contest.group
      ? `Group ${contest.group}`
      : "All approved participants";

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Back link */}
      <Link
        to="/admin/contests"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "16px",
          color: c.text.muted,
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={14} />
        Back to Contests
      </Link>

      {/* Header */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: c.radius.lg,
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06))",
          border: `1px solid ${c.border.subtle}`,
          overflow: "hidden",
          marginBottom: "20px",
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
            background: "radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%)",
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
                  color: "rgba(255, 215, 0, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Result Entry
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  margin: 0,
                  background: "linear-gradient(135deg, #FFFFFF, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {contest.name}
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {scopeLabel} · {contest.status} · {roster.length} participant
                {roster.length !== 1 ? "s" : ""}
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
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${c.border.mid}`,
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: refreshing ? "wait" : "pointer",
              opacity: refreshing ? 0.6 : 1,
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

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Eligible (video approved)"
          value={eligibleCount}
          color={c.accent.green}
          icon={<Video size={16} />}
        />
        <StatCard
          label="Not eligible (auto 0)"
          value={notEligibleCount}
          color={c.accent.red}
          icon={<VideoOff size={16} />}
        />
        <StatCard
          label="Results saved"
          value={enteredCount}
          color={c.accent.blue}
          icon={<Save size={16} />}
        />
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: c.radius.md,
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.25)",
            color: c.accent.red,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: c.radius.md,
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.25)",
            color: c.accent.green,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle size={16} />
          {notice}
        </div>
      )}

      {/* Roster table */}
      {roster.length === 0 ? (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.mid}`,
          }}
        >
          <Users size={40} color={c.text.faint} style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: 0, color: c.text.secondary }}>No eligible participants</h3>
          <p style={{ color: c.text.muted, marginTop: "6px" }}>
            {contest.stage === "GROUP_STAGE" && contest.group
              ? `Group ${contest.group} has no approved participants yet.`
              : "This contest has no approved participants."}
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
                <tr
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: `1px solid ${c.border.subtle}`,
                  }}
                >
                  <Th>Rank</Th>
                  <Th>Participant</Th>
                  <Th align="center">Group</Th>
                  <Th align="center">Video</Th>
                  <Th align="center">Solved</Th>
                  <Th align="center">Penalty (min)</Th>
                  <Th align="center">Save</Th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => {
                  const edit = edits[r.participantId] || {
                    solved: r.solved,
                    penalty: r.penalty,
                  };
                  const preview = previewRanks[r.participantId] ?? r.rank ?? "—";
                  const isSaved = savedIds.has(r.participantId);
                  const isSaving = savingId === r.participantId;
                  const isEligible = r.isEligible;
                  const videoTone = getVideoTone(r.videoStatus);
                  const name = r.user?.name || r.user?.username || "Unknown";
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={r.participantId}
                      style={{
                        borderBottom: `1px solid ${c.border.subtle}`,
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background:
                              preview === 1
                                ? "linear-gradient(135deg, #FFD700, #FFA000)"
                                : preview === 2
                                  ? "linear-gradient(135deg, #C0C0C0, #9E9E9E)"
                                  : preview === 3
                                    ? "linear-gradient(135deg, #CD7F32, #A0522D)"
                                    : "rgba(255,255,255,0.05)",
                            color:
                              typeof preview === "number" && preview <= 3
                                ? "#fff"
                                : c.text.secondary,
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {preview}
                        </span>
                      </td>

                      {/* Participant */}
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "13px",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: c.text.primary,
                              }}
                            >
                              {name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: c.text.muted,
                              }}
                            >
                              @{r.user?.username || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        {r.group ? (
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "rgba(156,39,176,0.12)",
                              border: "1px solid rgba(156,39,176,0.25)",
                              color: c.accent.purple,
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {r.group}
                          </span>
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      {/* Video status */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: `${videoTone.color}15`,
                            border: `1px solid ${videoTone.color}30`,
                            color: videoTone.color,
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          {videoTone.icon}
                          {videoTone.label}
                        </span>
                      </td>

                      {/* Solved input */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          value={edit.solved}
                          onChange={(e) =>
                            setEdit(r.participantId, {
                              solved: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          disabled={!isEligible}
                          style={{
                            width: "70px",
                            padding: "7px 10px",
                            borderRadius: c.radius.sm,
                            background: isEligible
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(255,255,255,0.02)",
                            border: `1px solid ${c.border.mid}`,
                            color: isEligible ? "#fff" : c.text.faint,
                            fontSize: "13px",
                            textAlign: "center",
                            outline: "none",
                            cursor: isEligible ? "text" : "not-allowed",
                          }}
                        />
                      </td>

                      {/* Penalty input */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          value={edit.penalty}
                          onChange={(e) =>
                            setEdit(r.participantId, {
                              penalty: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          disabled={!isEligible}
                          style={{
                            width: "90px",
                            padding: "7px 10px",
                            borderRadius: c.radius.sm,
                            background: isEligible
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(255,255,255,0.02)",
                            border: `1px solid ${c.border.mid}`,
                            color: isEligible ? "#fff" : c.text.faint,
                            fontSize: "13px",
                            textAlign: "center",
                            outline: "none",
                            cursor: isEligible ? "text" : "not-allowed",
                          }}
                        />
                      </td>

                      {/* Save button */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSave(r.participantId)}
                          disabled={isSaving || !isEligible}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "7px 14px",
                            borderRadius: c.radius.sm,
                            background: isSaved
                              ? "rgba(76,175,80,0.15)"
                              : "linear-gradient(135deg, #2979FF, #1565C0)",
                            border: isSaved ? "1px solid rgba(76,175,80,0.35)" : "none",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: isSaving || !isEligible ? "not-allowed" : "pointer",
                            opacity: isSaving || !isEligible ? 0.5 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw
                                size={12}
                                style={{
                                  animation: "spin 0.9s linear infinite",
                                }}
                              />
                              Saving…
                            </>
                          ) : isSaved ? (
                            <>
                              <CheckCircle size={12} />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save size={12} />
                              Save
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ---- Helpers --------------------------------------------------------

const Th: React.FC<{ children: React.ReactNode; align?: "left" | "center" }> = ({
  children,
  align = "left",
}) => (
  <th
    style={{
      padding: "12px 16px",
      textAlign: align,
      fontSize: "11px",
      fontWeight: 700,
      color: "rgba(255,255,255,0.4)",
      textTransform: "uppercase",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: `${color}1a`,
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
          color: "rgba(255,255,255,0.5)",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default AdminContestResults;
