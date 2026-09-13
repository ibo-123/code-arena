import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Send,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  Sparkles,
  Info,
  FileText,
  PlayCircle,
  ClipboardList,
} from "lucide-react";
import { ErrorState, LoadingState } from "../../components/ui";
import { adminApi, type AdminContest, type ContestPayload } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";

const STAGE_OPTIONS: Array<{
  value: ContestPayload["stage"];
  label: string;
}> = [
  { value: "QUALIFICATION", label: "Qualification Round" },
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "QUARTER_FINAL", label: "Quarter Final" },
  { value: "SEMI_FINAL", label: "Semi Final" },
  { value: "FINAL", label: "Final" },
];

// Stages that need a match number (actual bracket rounds)
const KNOCKOUT_STAGES: ContestPayload["stage"][] = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"];

interface ContestFormState {
  name: string;
  invitationUrl: string;
  stage: ContestPayload["stage"];
  group: string;
  matchNumber?: number;
  startTime: string;
  durationMinutes: number;
  description: string;
}

// ---- Design tokens ---------------------------------------------------

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    header: "rgba(255, 255, 255, 0.04)",
    input: "rgba(255, 255, 255, 0.04)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
    input: "rgba(255, 255, 255, 0.08)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    faint: "rgba(255, 255, 255, 0.3)",
  },
  accent: {
    blue: "#64B5F6",
    green: "#4CAF50",
    red: "#EF5350",
    gold: "#FFD700",
    purple: "#CE93D8",
    orange: "#FF9800",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
} as const;

const emptyForm = (): ContestFormState => ({
  name: "",
  invitationUrl: "",
  stage: "GROUP_STAGE",
  group: "",
  matchNumber: undefined,
  startTime: "",
  durationMinutes: 180,
  description: "",
});

const formatDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const isValidCodeforcesUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /(^|\.)codeforces\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "LIVE":
      return c.accent.red;
    case "FINISHED":
      return c.accent.green;
    case "PUBLISHED":
    case "UPCOMING":
      return c.accent.blue;
    default:
      return c.text.muted;
  }
};

const canEnterResults = (contest: AdminContest): boolean =>
  contest.published && (contest.status === "FINISHED" || contest.status === "LIVE");

export const AdminContests = () => {
  const { selectedTournament } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contests, setContests] = useState<AdminContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState<AdminContest | null>(null);
  const [form, setForm] = useState<ContestFormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tournamentId = selectedTournament?._id;

  // ---- Load ----------------------------------------------------------
  const loadContests = useCallback(async () => {
    if (!tournamentId) {
      setContests([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const res = await adminApi.getContests(tournamentId);
      setContests(res.contests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    loadContests();
  }, [loadContests]);

  // ---- Handle ?edit=<contestId> query param --------------------------
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || contests.length === 0) return;
    const found = contests.find((x) => x._id === editId);
    if (found) openEditForm(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, contests]);

  // ---- Handlers ------------------------------------------------------
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContests();
    setRefreshing(false);
  };

  const openCreateForm = () => {
    setEditingContest(null);
    setForm(emptyForm());
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (contest: AdminContest) => {
    setEditingContest(contest);
    setForm({
      name: contest.name,
      invitationUrl: contest.invitationUrl,
      stage: contest.stage as ContestPayload["stage"],
      group: contest.group || "",
      matchNumber: contest.matchNumber ?? undefined,
      startTime: formatDateTimeLocal(contest.startTime),
      durationMinutes: contest.durationSeconds ? Math.round(contest.durationSeconds / 60) : 180,
      description: contest.description || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingContest(null);
    setForm(emptyForm());
    setFormError("");
    if (searchParams.get("edit")) {
      searchParams.delete("edit");
      setSearchParams(searchParams);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId) return;
    setFormError("");

    if (!form.name.trim()) return setFormError("Contest name is required");
    if (!form.invitationUrl.trim()) return setFormError("Invitation URL is required");
    if (!isValidCodeforcesUrl(form.invitationUrl))
      return setFormError(
        "Invitation URL must be a valid Codeforces link (https://codeforces.com/...)",
      );
    if (!form.startTime) return setFormError("Start time is required");
    if (form.stage === "GROUP_STAGE" && !form.group.trim())
      return setFormError("Group is required for GROUP_STAGE contests");

    // ---- Only actual knockout stages require a match number ----
    if (KNOCKOUT_STAGES.includes(form.stage) && !form.matchNumber)
      return setFormError("Match number is required for knockout stage contests");

    setSubmitting(true);
    try {
      const payload: ContestPayload = {
        name: form.name.trim(),
        invitationUrl: form.invitationUrl.trim(),
        stage: form.stage,
        group: form.stage === "GROUP_STAGE" ? form.group.trim().toUpperCase() : undefined,
        matchNumber: KNOCKOUT_STAGES.includes(form.stage) ? form.matchNumber : undefined,
        startTime: new Date(form.startTime).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 180,
        description: form.description.trim() || undefined,
      };

      if (editingContest) {
        await adminApi.updateContest(tournamentId, editingContest._id, payload);
        setNotice("Contest updated successfully");
      } else {
        await adminApi.createContest(tournamentId, payload);
        setNotice("Contest created as draft");
      }

      closeForm();
      await loadContests();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: any[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to save contest");
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (contest: AdminContest) => {
    if (!tournamentId) return;
    if (!confirm(`Publish "${contest.name}"? Participants will see the invitation.`)) return;

    setPublishingId(contest._id);
    try {
      await adminApi.publishContest(tournamentId, contest._id);
      setNotice(`Contest "${contest.name}" published`);
      await loadContests();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish contest");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (contest: AdminContest) => {
    if (!tournamentId) return;
    if (contest.published) {
      alert("Published contests cannot be deleted.");
      return;
    }
    if (!confirm(`Delete draft "${contest.name}"?`)) return;

    setDeletingId(contest._id);
    try {
      await adminApi.deleteContest(tournamentId, contest._id);
      setNotice("Draft deleted");
      await loadContests();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contest");
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Stats ---------------------------------------------------------
  const stats = useMemo(() => {
    const total = contests.length;
    const published = contests.filter((x) => x.published).length;
    const drafts = contests.filter((x) => !x.published).length;
    const live = contests.filter((x) => x.status === "LIVE").length;
    return { total, published, drafts, live };
  }, [contests]);

  if (!selectedTournament) {
    return (
      <ErrorState error="No tournament selected. Please pick a tournament from the sidebar." />
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ---- Header ---- */}
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
                background: "linear-gradient(135deg, #2979FF, #1565C0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    color: "rgba(100, 181, 246, 0.85)",
                  }}
                >
                  Manual Invitation Management
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(41, 121, 255, 0.12)",
                    border: "1px solid rgba(41, 121, 255, 0.25)",
                    color: c.accent.blue,
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={10} />
                  No CF API
                </span>
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
                Contest Management
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {selectedTournament.name} · {stats.total} contest
                {stats.total !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={secondaryButton}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshing ? "spin 0.9s linear infinite" : "none",
                }}
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={openCreateForm} style={primaryButton}>
              <Plus size={16} />
              Add Contest
            </button>
          </div>
        </div>
      </div>

      {/* ---- Stat row ---- */}
      {!loading && contests.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon={<Trophy size={18} />}
            label="Total"
            value={stats.total}
            color={c.accent.blue}
          />
          <StatCard
            icon={<Send size={18} />}
            label="Published"
            value={stats.published}
            color={c.accent.green}
          />
          <StatCard
            icon={<FileText size={18} />}
            label="Drafts"
            value={stats.drafts}
            color={c.accent.orange}
          />
          <StatCard
            icon={<PlayCircle size={18} />}
            label="Live"
            value={stats.live}
            color={c.accent.red}
          />
        </div>
      )}

      {/* ---- Alerts ---- */}
      {error && (
        <div style={alertStyle(c.accent.red, "rgba(239, 83, 80, 0.1)")}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div style={alertStyle(c.accent.green, "rgba(76, 175, 80, 0.1)")}>
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {/* ---- List ---- */}
      {loading ? (
        <LoadingState label="Loading contests..." />
      ) : contests.length === 0 ? (
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
              background: "rgba(41, 121, 255, 0.06)",
              border: "1px solid rgba(41, 121, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.accent.blue,
              marginBottom: "8px",
            }}
          >
            <Trophy size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: c.text.secondary,
              margin: 0,
            }}
          >
            No contests yet
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
            Create your first contest invitation to get started.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            style={{ ...primaryButton, marginTop: "8px" }}
          >
            <Plus size={16} />
            Create Contest
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {contests.map((contest) => (
            <ContestCard
              key={contest._id}
              contest={contest}
              publishing={publishingId === contest._id}
              deleting={deletingId === contest._id}
              onEdit={() => openEditForm(contest)}
              onPublish={() => handlePublish(contest)}
              onDelete={() => handleDelete(contest)}
            />
          ))}
        </div>
      )}

      {/* ---- Form modal ---- */}
      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={closeForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0F1420",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: `1px solid ${c.border.subtle}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "rgba(100, 181, 246, 0.85)",
                    marginBottom: "2px",
                  }}
                >
                  {editingContest ? "Edit Contest" : "New Contest"}
                </div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                  {editingContest ? editingContest.name : "Add Contest"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${c.border.subtle}`,
                  borderRadius: "8px",
                  color: c.text.muted,
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {formError && (
                <div
                  style={{
                    ...alertStyle(c.accent.red, "rgba(239, 83, 80, 0.1)"),
                    padding: "10px 14px",
                    fontSize: "12px",
                  }}
                >
                  <AlertCircle size={14} />
                  {formError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <Field label="Contest Name *" htmlFor="contest-name">
                  <input
                    id="contest-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Group 1 Contest — Round 1"
                    style={inputBase}
                    required
                  />
                </Field>

                <Field label="Codeforces Invitation URL *" htmlFor="contest-invitation-url">
                  <input
                    id="contest-invitation-url"
                    type="url"
                    value={form.invitationUrl}
                    onChange={(e) => setForm({ ...form, invitationUrl: e.target.value })}
                    placeholder="https://codeforces.com/group/.../contest/..."
                    style={inputBase}
                    required
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: c.text.faint,
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Info size={10} />
                    No Codeforces API validation — basic URL check only
                  </div>
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <Field label="Stage *" htmlFor="contest-stage">
                    <select
                      id="contest-stage"
                      value={form.stage}
                      onChange={(e) => {
                        const nextStage = e.target.value as ContestPayload["stage"];
                        setForm({
                          ...form,
                          stage: nextStage,
                          group: nextStage === "GROUP_STAGE" ? form.group : "",
                          matchNumber: KNOCKOUT_STAGES.includes(nextStage)
                            ? form.matchNumber
                            : undefined,
                        });
                      }}
                      style={inputBase}
                    >
                      {STAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ background: "#0F1420" }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {form.stage === "GROUP_STAGE" ? (
                    <Field label="Group *" htmlFor="contest-group">
                      <input
                        id="contest-group"
                        type="text"
                        value={form.group}
                        onChange={(e) => setForm({ ...form, group: e.target.value })}
                        placeholder="e.g., A or 1"
                        style={inputBase}
                      />
                    </Field>
                  ) : KNOCKOUT_STAGES.includes(form.stage) ? (
                    <Field label="Match Number *" htmlFor="contest-match">
                      <input
                        id="contest-match"
                        type="number"
                        min={1}
                        value={form.matchNumber ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            matchNumber: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="e.g., 1, 2, 3, 4"
                        style={inputBase}
                      />
                    </Field>
                  ) : (
                    // QUALIFICATION doesn't need a second field
                    <div />
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <Field label="Start Date/Time *" htmlFor="contest-start-time">
                    <input
                      id="contest-start-time"
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      style={{ ...inputBase, colorScheme: "dark" }}
                      required
                    />
                  </Field>
                  <Field label="Duration (min) *" htmlFor="contest-duration">
                    <input
                      id="contest-duration"
                      type="number"
                      min={1}
                      value={form.durationMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                      style={inputBase}
                      required
                    />
                  </Field>
                </div>

                <Field label="Description (optional)" htmlFor="contest-description">
                  <textarea
                    id="contest-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Any additional info participants should know..."
                    style={{
                      ...inputBase,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </Field>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${c.border.subtle}`,
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  style={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...primaryButton,
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Saving…" : editingContest ? "Save Changes" : "Create Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
        }
        input:hover:not(:disabled), select:hover, textarea:hover {
          border-color: rgba(255,255,255,0.16) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// Contest Card
// ============================================================

interface ContestCardProps {
  contest: AdminContest;
  publishing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  publishing,
  deleting,
  onEdit,
  onPublish,
  onDelete,
}) => {
  const statusColor = getStatusColor(contest.status);
  const isLive = contest.status === "LIVE";
  const showResults = canEnterResults(contest);

  return (
    <article
      style={{
        position: "relative",
        padding: "18px 20px",
        background: c.bg.card,
        border: `1px solid ${isLive ? `${c.accent.red}40` : c.border.subtle}`,
        borderRadius: c.radius.lg,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (!isLive) {
          e.currentTarget.style.borderColor = `${c.accent.blue}40`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!isLive) {
          e.currentTarget.style.borderColor = c.border.subtle;
        }
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <Chip label={contest.stage.replace(/_/g, " ")} color={c.accent.purple} />
            {contest.group && (
              <Chip
                label={`Group ${contest.group}`}
                color={c.accent.blue}
                icon={<Users size={10} />}
              />
            )}
            {!contest.group && contest.matchNumber && (
              <Chip label={`Match ${contest.matchNumber}`} color={c.accent.orange} />
            )}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: c.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contest.name}
          </h3>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: `${statusColor}1a`,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusColor,
              boxShadow: isLive ? `0 0 6px ${statusColor}` : "none",
              animation: isLive ? "contestPulse 1.5s infinite" : "none",
            }}
          />
          {contest.status}
        </span>
      </div>

      {contest.description && (
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: c.text.muted,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {contest.description}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: c.text.muted,
        }}
      >
        {contest.startTime && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Calendar size={12} />
            {new Date(contest.startTime).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {contest.durationSeconds ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={12} />
            {Math.round(contest.durationSeconds / 60)} min
          </span>
        ) : null}
      </div>

      <a
        href={contest.invitationUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: c.accent.blue,
          textDecoration: "none",
          padding: "8px 10px",
          borderRadius: c.radius.sm,
          background: "rgba(41,121,255,0.06)",
          border: "1px solid rgba(41,121,255,0.15)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <ExternalLink size={12} style={{ flexShrink: 0 }} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {contest.invitationUrl}
        </span>
      </a>

      {showResults && (
        <Link
          to={`/admin/contests/${contest._id}/results`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 14px",
            borderRadius: c.radius.sm,
            background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,160,0,0.06))",
            border: "1px solid rgba(255,215,0,0.3)",
            color: c.accent.gold,
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "background-color 0.15s ease, transform 0.2s ease",
          }}
        >
          <ClipboardList size={14} />
          Enter Results
        </Link>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "auto",
          paddingTop: "10px",
          borderTop: `1px solid ${c.border.subtle}`,
        }}
      >
        <button type="button" onClick={onEdit} style={{ ...smallButton, flex: 1 }}>
          <Edit3 size={14} />
          Edit
        </button>

        {!contest.published && (
          <>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              style={{
                ...smallButton,
                flex: 1,
                background: "rgba(76,175,80,0.15)",
                borderColor: "rgba(76,175,80,0.3)",
                color: c.accent.green,
                opacity: publishing ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              {publishing ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Delete draft"
              style={{
                ...smallButton,
                background: "rgba(244,67,54,0.1)",
                borderColor: "rgba(244,67,54,0.2)",
                color: c.accent.red,
                opacity: deleting ? 0.6 : 1,
                padding: "6px 10px",
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </article>
  );
};

// ============================================================
// Small helpers
// ============================================================

interface ChipProps {
  label: string;
  color: string;
  icon?: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({ label, color, icon }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 9px",
      borderRadius: "6px",
      background: `${color}1a`,
      border: `1px solid ${color}30`,
      color,
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
      whiteSpace: "nowrap",
    }}
  >
    {icon}
    {label}
  </span>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, children }) => (
  <div>
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        color: c.text.secondary,
        marginBottom: "6px",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: c.radius.md,
      background: c.bg.card,
      border: `1px solid ${c.border.subtle}`,
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = c.border.subtle;
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: c.radius.sm,
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
          color: c.text.muted,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
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

// ---- Style constants --------------------------------------------------

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: c.radius.sm,
  background: c.bg.input,
  border: `1px solid ${c.border.input}`,
  color: c.text.primary,
  fontSize: "14px",
  outline: "none",
  transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 18px",
  borderRadius: c.radius.md,
  background: "linear-gradient(135deg, #2979FF, #1565C0)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 18px",
  borderRadius: c.radius.md,
  background: "rgba(255, 255, 255, 0.04)",
  border: `1px solid ${c.border.mid}`,
  color: c.text.primary,
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const smallButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  padding: "7px 12px",
  borderRadius: c.radius.sm,
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${c.border.input}`,
  color: c.text.secondary,
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.15s ease, border-color 0.15s ease",
};

const alertStyle = (color: string, bg: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 18px",
  borderRadius: c.radius.md,
  background: bg,
  border: `1px solid ${color}40`,
  color,
  fontSize: "13px",
  marginBottom: "16px",
});

export default AdminContests;
