import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  Layers,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
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

interface ContestFormState {
  name: string;
  invitationUrl: string;
  stage: ContestPayload["stage"];
  group: string;
  startTime: string;
  durationMinutes: number;
  description: string;
}

const emptyForm = (): ContestFormState => ({
  name: "",
  invitationUrl: "",
  stage: "GROUP_STAGE",
  group: "",
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

  // Load contests
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

  // Handle ?edit=<contestId> query param
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || contests.length === 0) return;
    const found = contests.find((c) => c._id === editId);
    if (found) openEditForm(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, contests]);

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

    // Client-side validation
    if (!form.name.trim()) return setFormError("Contest name is required");
    if (!form.invitationUrl.trim()) return setFormError("Invitation URL is required");
    if (!isValidCodeforcesUrl(form.invitationUrl))
      return setFormError(
        "Invitation URL must be a valid Codeforces link (https://codeforces.com/...)",
      );
    if (!form.startTime) return setFormError("Start time is required");
    if (form.stage === "GROUP_STAGE" && !form.group.trim())
      return setFormError("Group is required for GROUP_STAGE contests");

    setSubmitting(true);
    try {
      const payload: ContestPayload = {
        name: form.name.trim(),
        invitationUrl: form.invitationUrl.trim(),
        stage: form.stage,
        group: form.stage === "GROUP_STAGE" ? form.group.trim().toUpperCase() : undefined,
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

  // ---------- Render helpers ----------
  const statusTone = (
    status: AdminContest["status"],
  ): "gold" | "green" | "red" | "blue" | "muted" => {
    switch (status) {
      case "PUBLISHED":
        return "blue";
      case "LIVE":
        return "red";
      case "FINISHED":
        return "green";
      case "UPCOMING":
        return "blue";
      case "CANCELLED":
        return "muted";
      default:
        return "muted";
    }
  };

  if (!selectedTournament) {
    return (
      <ErrorState error="No tournament selected. Please pick a tournament from the sidebar." />
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
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
            Manual Invitation Management
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Contest Management
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            {selectedTournament.name} · {contests.length} contest{contests.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Badge tone="blue">
            <Sparkles size={12} style={{ marginRight: 4 }} />
            No Codeforces API
          </Badge>
          <button onClick={handleRefresh} disabled={refreshing} style={secondaryButtonStyle}>
            <RefreshCw
              size={16}
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={openCreateForm} style={primaryButtonStyle}>
            <Plus size={18} />
            Add Contest
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div style={alertStyle("#FF6B6B", "rgba(244,67,54,0.1)")}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {notice && (
        <div style={alertStyle("#4CAF50", "rgba(76,175,80,0.1)")}>
          <CheckCircle size={20} />
          {notice}
        </div>
      )}

      {/* List */}
      {loading ? (
        <LoadingState label="Loading contests..." />
      ) : contests.length === 0 ? (
        <Card
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(41,121,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Trophy size={32} color="rgba(100,181,246,0.5)" />
          </div>
          <h3 style={{ margin: "0 0 8px 0", color: "rgba(255,255,255,0.8)" }}>No contests yet</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>
            Create your first contest invitation to get started.
          </p>
          <button onClick={openCreateForm} style={primaryButtonStyle}>
            <Plus size={18} />
            Create Contest
          </button>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {contests.map((c) => (
            <Card
              key={c._id}
              style={{
                padding: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {/* Header row */}
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
                      marginBottom: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge tone="blue">{c.stage.replace("_", " ")}</Badge>
                    {c.group && (
                      <Badge tone="muted">
                        <Users size={10} style={{ marginRight: 3 }} />
                        Group {c.group}
                      </Badge>
                    )}
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "white",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </h3>
                </div>
              </div>

              {/* Description */}
              {c.description && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {c.description}
                </p>
              )}

              {/* Meta */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} />
                  {c.startTime ? new Date(c.startTime).toLocaleString() : "No date"}
                </span>
                {c.durationSeconds ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {Math.round(c.durationSeconds / 60)} min
                  </span>
                ) : null}
              </div>

              {/* Invitation URL */}
              <a
                href={c.invitationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#64B5F6",
                  textDecoration: "none",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(41,121,255,0.06)",
                  border: "1px solid rgba(41,121,255,0.12)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <ExternalLink size={12} />
                {c.invitationUrl}
              </a>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "auto",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <button onClick={() => openEditForm(c)} style={smallButtonStyle}>
                  <Edit3 size={14} />
                  Edit
                </button>

                {!c.published && (
                  <>
                    <button
                      onClick={() => handlePublish(c)}
                      disabled={publishingId === c._id}
                      style={{
                        ...smallButtonStyle,
                        background: "rgba(76,175,80,0.15)",
                        borderColor: "rgba(76,175,80,0.3)",
                        color: "#4CAF50",
                      }}
                    >
                      <Send size={14} />
                      {publishingId === c._id ? "Publishing..." : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c._id}
                      style={{
                        ...smallButtonStyle,
                        background: "rgba(244,67,54,0.1)",
                        borderColor: "rgba(244,67,54,0.2)",
                        color: "#FF6B6B",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
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
              background: "#1a1f35",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "white" }}>
                  {editingContest ? "Edit Contest" : "Add Contest"}
                </h2>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Manually enter the Codeforces invitation link
                </p>
              </div>
              <button
                onClick={closeForm}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {formError && (
                <div style={alertStyle("#FF6B6B", "rgba(244,67,54,0.1)")}>
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Name */}
                <FormField label="Contest Name *">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Group 1 Contest — Round 1"
                    style={inputStyle}
                    required
                  />
                </FormField>

                {/* Invitation URL */}
                <FormField label="Codeforces Invitation URL *">
                  <input
                    type="url"
                    value={form.invitationUrl}
                    onChange={(e) => setForm({ ...form, invitationUrl: e.target.value })}
                    placeholder="https://codeforces.com/group/.../contest/..."
                    style={inputStyle}
                    required
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Info size={10} />
                    No Codeforces API validation — basic URL check only
                  </div>
                </FormField>

                {/* Stage + Group */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: form.stage === "GROUP_STAGE" ? "1fr 1fr" : "1fr",
                    gap: "12px",
                  }}
                >
                  <FormField label="Stage *">
                    <select
                      value={form.stage}
                      onChange={(e) =>
                        setForm({ ...form, stage: e.target.value as ContestPayload["stage"] })
                      }
                      style={inputStyle}
                    >
                      {STAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ background: "#1a1f35" }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {form.stage === "GROUP_STAGE" && (
                    <FormField label="Group *">
                      <input
                        type="text"
                        value={form.group}
                        onChange={(e) => setForm({ ...form, group: e.target.value })}
                        placeholder="e.g., A or 1"
                        style={inputStyle}
                      />
                    </FormField>
                  )}
                </div>

                {/* Start time + duration */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <FormField label="Start Date/Time *">
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      required
                    />
                  </FormField>
                  <FormField label="Duration (minutes) *">
                    <input
                      type="number"
                      min={1}
                      value={form.durationMinutes}
                      onChange={(e) =>
                        setForm({ ...form, durationMinutes: Number(e.target.value) })
                      }
                      style={inputStyle}
                      required
                    />
                  </FormField>
                </div>

                {/* Description */}
                <FormField label="Description (optional)">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Any additional info participants should know..."
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  />
                </FormField>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  style={secondaryButtonStyle}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Saving..." : editingContest ? "Save Changes" : "Create Contest"}
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
      `}</style>
    </div>
  );
};

// ---------- Small local components / styles ----------
const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: "600",
        color: "rgba(255,255,255,0.6)",
        marginBottom: "6px",
        letterSpacing: "0.3px",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #2979FF, #1565C0)",
  border: "none",
  color: "white",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s ease",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  transition: "all 0.2s ease",
};

const alertStyle = (color: string, bg: string): React.CSSProperties => ({
  padding: "12px 16px",
  borderRadius: "10px",
  background: bg,
  border: `1px solid ${color}33`,
  color,
  fontSize: "13px",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export default AdminContests;
