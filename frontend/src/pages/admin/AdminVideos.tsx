import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { contestApi } from "../../services/contestApi";
import { adminApi, type AdminContest } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import type { VideoSubmission, VideoStatus } from "../../types";

/**
 * Extended view of a VideoSubmission when the backend populates
 * `participantId` with a full Participant object (including nested `user`).
 *
 * NOTE: We do NOT `extend VideoSubmission` because TypeScript would complain
 * that the parent's `participantId: string` conflicts with our object type.
 */
interface VideoWithDetails {
  _id: string;
  contestId: string;
  tournamentId: string;
  videoUrl: string;
  note?: string;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  participantId?:
    | string
    | {
        _id?: string;
        group?: string;
        seed?: number;
        user?: {
          name?: string;
          username?: string;
          codeforcesUsername?: string;
        };
      };
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

/** Narrow a participantId that may be either a string or a populated object. */
const getParticipantObject = (
  value: VideoWithDetails["participantId"],
): {
  _id?: string;
  group?: string;
  seed?: number;
  user?: { name?: string; username?: string; codeforcesUsername?: string };
} | null => {
  if (!value || typeof value === "string") return null;
  return value;
};

export const AdminVideos = () => {
  const { selectedTournament } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contests, setContests] = useState<AdminContest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [selectedVideo, setSelectedVideo] = useState<VideoWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tournamentId = selectedTournament?._id;

  // Load contests
  useEffect(() => {
    let mounted = true;
    if (!tournamentId) {
      setContests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    adminApi
      .getContests(tournamentId)
      .then((res) => {
        if (!mounted) return;
        setContests(res.contests || []);
        const fromQuery = searchParams.get("contestId");
        const pick =
          (fromQuery && res.contests?.find((c) => c._id === fromQuery)?._id) ||
          res.contests?.[0]?._id ||
          "";
        setSelectedContestId(pick);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load contests");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const loadVideos = useCallback(async () => {
    if (!selectedContestId) {
      setVideos([]);
      return;
    }
    try {
      setLoadingVideos(true);
      setError("");
      const statusParam = filter === "ALL" ? undefined : filter;
      const res = await contestApi.getVideoSubmissions(selectedContestId, statusParam);
      setVideos((res.submissions || []) as unknown as VideoWithDetails[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [selectedContestId, filter]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleContestChange = (id: string) => {
    setSelectedContestId(id);
    if (id) {
      searchParams.set("contestId", id);
    } else {
      searchParams.delete("contestId");
    }
    setSearchParams(searchParams);
  };

  const handleApprove = async (submissionId: string) => {
    setSubmitting(true);
    try {
      await contestApi.approveVideo(submissionId);
      setNotice("Video approved");
      setSelectedVideo(null);
      await loadVideos();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (submissionId: string) => {
    setSubmitting(true);
    try {
      await contestApi.rejectVideo(submissionId, rejectReason || "No reason provided");
      setNotice("Video rejected");
      setSelectedVideo(null);
      setShowRejectForm(false);
      setRejectReason("");
      await loadVideos();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject video");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedTournament) {
    return <ErrorState error="No tournament selected." />;
  }

  if (loading) return <LoadingState label="Loading contests..." />;

  const currentContest = contests.find((c) => c._id === selectedContestId);

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

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
            Video Review
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Video Submissions
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            {currentContest?.name || currentContest?.stage?.replace("_", " ") || "Select a contest"}
          </p>
        </div>
        <button
          onClick={loadVideos}
          disabled={loadingVideos}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            cursor: loadingVideos ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: loadingVideos ? "spin 1s linear infinite" : "none" }}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(244,67,54,0.1)",
            border: "1px solid rgba(244,67,54,0.2)",
            color: "#FF6B6B",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(76,175,80,0.1)",
            border: "1px solid rgba(76,175,80,0.2)",
            color: "#4CAF50",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {/* Contest + filter selector */}
      <Card
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={14} color="rgba(255,255,255,0.4)" />
            <select
              value={selectedContestId}
              onChange={(e) => handleContestChange(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "13px",
                outline: "none",
                minWidth: "200px",
              }}
            >
              <option value="" style={{ background: "#1a1f35" }}>
                Select a contest...
              </option>
              {contests.map((c) => (
                <option key={c._id} value={c._id} style={{ background: "#1a1f35" }}>
                  {c.name || c.stage?.replace("_", " ") || "Untitled Contest"}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {filterButtons.map((fb) => (
              <button
                key={fb.value}
                onClick={() => setFilter(fb.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background:
                    filter === fb.value ? "rgba(41,121,255,0.2)" : "rgba(255,255,255,0.04)",
                  border:
                    filter === fb.value
                      ? "1px solid rgba(41,121,255,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                  color: filter === fb.value ? "#64B5F6" : "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                {fb.label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            {videos.length} submission{videos.length !== 1 ? "s" : ""}
          </div>
        </div>
      </Card>

      {/* List */}
      {loadingVideos ? (
        <LoadingState label="Loading video submissions..." />
      ) : !selectedContestId ? (
        <EmptyState label="Select a contest to view its video submissions." />
      ) : videos.length === 0 ? (
        <EmptyState label="No video submissions found for this filter." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "14px",
          }}
        >
          {videos.map((v) => {
            const participant = getParticipantObject(v.participantId);
            const user = participant?.user;
            return (
              <Card
                key={v._id}
                style={{
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "white",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.name || user?.username || "Unknown"}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      @{user?.username || "unknown"}
                      {participant?.group ? ` · Group ${participant.group}` : ""}
                    </div>
                  </div>
                  <Badge
                    tone={
                      v.status === "APPROVED" ? "green" : v.status === "REJECTED" ? "red" : "gold"
                    }
                  >
                    {v.status === "APPROVED" ? (
                      <CheckCircle size={12} style={{ marginRight: 3 }} />
                    ) : v.status === "REJECTED" ? (
                      <XCircle size={12} style={{ marginRight: 3 }} />
                    ) : (
                      <Clock size={12} style={{ marginRight: 3 }} />
                    )}
                    {v.status}
                  </Badge>
                </div>

                {v.note && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {v.note}
                  </p>
                )}

                <a
                  href={v.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#64B5F6",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={12} /> Open Video
                </a>

                <button
                  onClick={() => {
                    setSelectedVideo(v);
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  style={{
                    marginTop: "auto",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(41,121,255,0.15)",
                    border: "1px solid rgba(41,121,255,0.25)",
                    color: "#64B5F6",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Review
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {selectedVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setSelectedVideo(null)}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", color: "white" }}>Review Submission</h2>
              <button
                onClick={() => setSelectedVideo(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {(() => {
                const participant = getParticipantObject(selectedVideo.participantId);
                const user = participant?.user;
                return (
                  <div
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
                  >
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Participant:</strong> {user?.name || "Unknown"} (
                      {user?.username || "—"})
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Codeforces:</strong> {user?.codeforcesUsername || "—"}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Group:</strong> {participant?.group || "—"}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Status:</strong> {selectedVideo.status}
                    </p>
                  </div>
                );
              })()}

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Video URL
                </label>
                <a
                  href={selectedVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: 4,
                    padding: "8px 10px",
                    background: "rgba(41,121,255,0.06)",
                    border: "1px solid rgba(41,121,255,0.15)",
                    borderRadius: 8,
                    color: "#64B5F6",
                    fontSize: 12,
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedVideo.videoUrl}
                </a>
              </div>

              {selectedVideo.note && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    Participant Note
                  </label>
                  <p
                    style={{
                      marginTop: 4,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {selectedVideo.note}
                  </p>
                </div>
              )}

              {showRejectForm ? (
                <div style={{ marginTop: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                    }}
                  >
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this video is being rejected..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      fontSize: 13,
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button
                      onClick={() => handleReject(selectedVideo._id)}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #F44336, #C62828)",
                        border: "none",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.6 : 1,
                      }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedVideo.status === "PENDING" ? (
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => handleApprove(selectedVideo._id)}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                      border: "none",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.6 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #F44336, #C62828)",
                      border: "none",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedVideo(null)}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminVideos;
