import { useEffect, useState, useCallback, useMemo } from "react";
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
  Video,
  Copy,
  Play,
} from "lucide-react";
import {  EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { contestApi } from "../../services/contestApi";
import { adminApi, type AdminContest } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import type { VideoStatus } from "../../types";

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

// ---- Helpers -----------------------------------------------------------

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

const getStatusTone = (
  status: string,
): { color: string; bg: string; border: string; icon: React.ReactNode } => {
  switch (status) {
    case "APPROVED":
      return {
        color: "#4CAF50",
        bg: "rgba(76, 175, 80, 0.12)",
        border: "rgba(76, 175, 80, 0.25)",
        icon: <CheckCircle size={12} />,
      };
    case "REJECTED":
      return {
        color: "#EF5350",
        bg: "rgba(239, 83, 80, 0.12)",
        border: "rgba(239, 83, 80, 0.25)",
        icon: <XCircle size={12} />,
      };
    default:
      return {
        color: "#FFD700",
        bg: "rgba(255, 215, 0, 0.12)",
        border: "rgba(255, 215, 0, 0.25)",
        icon: <Clock size={12} />,
      };
  }
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return match ? match[1] : null;
};

const getStreamableId = (url: string): string | null => {
  const match = url.match(/streamable\.com\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
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
  const [filter, setFilter] = useState<FilterStatus>("ALL"); // ← was PENDING
  const [selectedVideo, setSelectedVideo] = useState<VideoWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const tournamentId = selectedTournament?._id;

  // ---- Load contests --------------------------------------------------
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
        const list = res.contests || [];
        setContests(list);

        const fromQuery = searchParams.get("contestId");

        // ---- Smarter default selection ----
        // Prefer: ?contestId= → FINISHED contest → any published → first
        const pick =
          (fromQuery && list.find((c) => c._id === fromQuery)?._id) ||
          list.find((c) => c.status === "FINISHED")?._id ||
          list.find((c) => c.published)?._id ||
          list[0]?._id ||
          "";

        setSelectedContestId(pick);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load contests");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  // ---- Load videos ----------------------------------------------------
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

  // ---- Handlers -------------------------------------------------------
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

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — no-op
    }
  };

  // ---- Keyboard shortcuts for the modal -------------------------------
  useEffect(() => {
    if (!selectedVideo) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedVideo(null);
        setShowRejectForm(false);
        setRejectReason("");
      } else if (
        !showRejectForm &&
        selectedVideo.status === "PENDING" &&
        (e.key === "a" || e.key === "A") &&
        !submitting
      ) {
        handleApprove(selectedVideo._id);
      } else if (
        !showRejectForm &&
        selectedVideo.status === "PENDING" &&
        (e.key === "r" || e.key === "R")
      ) {
        setShowRejectForm(true);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo, showRejectForm, submitting]);

  // ---- Derived --------------------------------------------------------
  const statusCounts = useMemo(() => {
    const counts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const v of videos) {
      counts.ALL += 1;
      if (v.status === "PENDING") counts.PENDING += 1;
      else if (v.status === "APPROVED") counts.APPROVED += 1;
      else if (v.status === "REJECTED") counts.REJECTED += 1;
    }
    return counts;
  }, [videos]);

  if (!selectedTournament) {
    return <ErrorState error="No tournament selected." />;
  }

  if (loading) return <LoadingState label="Loading contests..." />;

  const currentContest = contests.find((c) => c._id === selectedContestId);

  const filterButtons: {
    value: FilterStatus;
    label: string;
    count: number;
    color: string;
  }[] = [
    { value: "ALL", label: "All", count: statusCounts.ALL, color: "#64B5F6" },
    {
      value: "PENDING",
      label: "Pending",
      count: statusCounts.PENDING,
      color: "#FFD700",
    },
    {
      value: "APPROVED",
      label: "Approved",
      count: statusCounts.APPROVED,
      color: "#4CAF50",
    },
    {
      value: "REJECTED",
      label: "Rejected",
      count: statusCounts.REJECTED,
      color: "#EF5350",
    },
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ---- Header ---- */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06))",
          border: "1px solid rgba(255, 255, 255, 0.06)",
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
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Video size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(100, 181, 246, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Video Review
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
                Video Submissions
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginTop: "2px",
                }}
              >
                {currentContest?.name ||
                  currentContest?.stage?.replace(/_/g, " ") ||
                  "Select a contest"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadVideos}
            disabled={loadingVideos}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loadingVideos ? "wait" : "pointer",
              opacity: loadingVideos ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: loadingVideos ? "spin 0.9s linear infinite" : "none",
              }}
            />
            {loadingVideos ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ---- Alerts ---- */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.25)",
            color: "#EF5350",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.25)",
            color: "#4CAF50",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {/* ---- Controls ---- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          padding: "14px 18px",
          marginBottom: "20px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "12px",
        }}
      >
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
              minWidth: "220px",
            }}
          >
            <option value="" style={{ background: "#1a1f35" }}>
              Select a contest...
            </option>
            {contests.map((c) => (
              <option key={c._id} value={c._id} style={{ background: "#1a1f35" }}>
                {c.name || c.stage?.replace(/_/g, " ") || "Untitled Contest"}
                {c.status ? ` · ${c.status}` : ""}
                {c.group ? ` · Group ${c.group}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          {filterButtons.map((fb) => {
            const isActive = filter === fb.value;
            return (
              <button
                key={fb.value}
                type="button"
                onClick={() => setFilter(fb.value)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background: isActive ? `${fb.color}1a` : "rgba(255,255,255,0.03)",
                  border: isActive ? `1px solid ${fb.color}40` : "1px solid rgba(255,255,255,0.06)",
                  color: isActive ? fb.color : "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {fb.label}
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "999px",
                    background: isActive ? `${fb.color}25` : "rgba(255,255,255,0.05)",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {fb.count}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          {videos.length} submission{videos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ---- List ---- */}
      {loadingVideos ? (
        <LoadingState label="Loading video submissions..." />
      ) : !selectedContestId ? (
        <EmptyState label="Select a contest to view its video submissions." />
      ) : videos.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: "16px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "16px",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
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
              color: "#64B5F6",
              marginBottom: "8px",
            }}
          >
            <Video size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
            }}
          >
            No submissions found
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.4)",
              margin: 0,
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            No video submissions match the current filter.
          </p>
        </div>
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
            const tone = getStatusTone(v.status);
            const name = user?.name || user?.username || "Unknown";
            const initial = name.charAt(0).toUpperCase();

            return (
              <article
                key={v._id}
                style={{
                  position: "relative",
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = `${tone.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
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
                    {initial}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "white",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "2px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>@{user?.username || "unknown"}</span>
                      {participant?.group && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span>Group {participant.group}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: tone.bg,
                      border: `1px solid ${tone.border}`,
                      color: tone.color,
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                    }}
                  >
                    {tone.icon}
                    {v.status}
                  </span>
                </div>

                {v.note && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.55,
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
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(41, 121, 255, 0.08)",
                    border: "1px solid rgba(41, 121, 255, 0.2)",
                    color: "#64B5F6",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Play size={12} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.videoUrl}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVideo(v);
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  style={{
                    marginTop: "auto",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background:
                      v.status === "PENDING"
                        ? "linear-gradient(135deg, #2979FF, #1565C0)"
                        : "rgba(255,255,255,0.04)",
                    border: v.status === "PENDING" ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: v.status === "PENDING" ? "#fff" : "rgba(255,255,255,0.7)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {v.status === "PENDING" ? "Review Submission" : "View Details"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* ---- Review Modal ---- */}
      {selectedVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review video submission"
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
          onClick={() => {
            setSelectedVideo(null);
            setShowRejectForm(false);
            setRejectReason("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "600px",
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
                borderBottom: "1px solid rgba(255,255,255,0.06)",
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
                  Review Submission
                </div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "white" }}>Video Details</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                aria-label="Close"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {(() => {
                const participant = getParticipantObject(selectedVideo.participantId);
                const user = participant?.user;
                const ytId = getYouTubeId(selectedVideo.videoUrl);
                const streamableId = getStreamableId(selectedVideo.videoUrl);

                return (
                  <>
                    {ytId && (
                      <div
                        style={{
                          marginBottom: "16px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          aspectRatio: "16 / 9",
                          background: "#000",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title="Video submission"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            width: "100%",
                            height: "100%",
                            border: 0,
                          }}
                        />
                      </div>
                    )}
                    {streamableId && !ytId && (
                      <div
                        style={{
                          marginBottom: "16px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          aspectRatio: "16 / 9",
                          background: "#000",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <iframe
                          src={`https://streamable.com/e/${streamableId}`}
                          title="Video submission"
                          allowFullScreen
                          style={{
                            width: "100%",
                            height: "100%",
                            border: 0,
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          color: "rgba(255, 255, 255, 0.4)",
                          marginBottom: "8px",
                        }}
                      >
                        Participant
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {user?.name || user?.username || "Unknown"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.5)",
                          marginTop: "2px",
                        }}
                      >
                        @{user?.username || "—"}
                        {user?.codeforcesUsername && (
                          <span style={{ marginLeft: 8 }}>· CF: {user.codeforcesUsername}</span>
                        )}
                        {participant?.group && (
                          <span style={{ marginLeft: 8 }}>· Group {participant.group}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          color: "rgba(255, 255, 255, 0.4)",
                          marginBottom: "6px",
                        }}
                      >
                        Video URL
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "stretch",
                        }}
                      >
                        <a
                          href={selectedVideo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            background: "rgba(41,121,255,0.06)",
                            border: "1px solid rgba(41,121,255,0.15)",
                            borderRadius: "10px",
                            color: "#64B5F6",
                            fontSize: "12px",
                            textDecoration: "none",
                            wordBreak: "break-all",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <ExternalLink size={12} />
                          {selectedVideo.videoUrl}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(selectedVideo.videoUrl)}
                          aria-label="Copy URL"
                          style={{
                            padding: "0 12px",
                            borderRadius: "10px",
                            background: copied
                              ? "rgba(76, 175, 80, 0.15)"
                              : "rgba(255,255,255,0.04)",
                            border: copied
                              ? "1px solid rgba(76, 175, 80, 0.3)"
                              : "1px solid rgba(255,255,255,0.08)",
                            color: copied ? "#4CAF50" : "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            flexShrink: 0,
                          }}
                        >
                          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {selectedVideo.note && (
                      <div style={{ marginBottom: "14px" }}>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            color: "rgba(255, 255, 255, 0.4)",
                            marginBottom: "6px",
                          }}
                        >
                          Participant Note
                        </div>
                        <p
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "10px",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.7)",
                            lineHeight: 1.6,
                          }}
                        >
                          {selectedVideo.note}
                        </p>
                      </div>
                    )}

                    {selectedVideo.status === "REJECTED" && selectedVideo.rejectionReason && (
                      <div style={{ marginBottom: "14px" }}>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            color: "#EF5350",
                            marginBottom: "6px",
                          }}
                        >
                          Rejection Reason
                        </div>
                        <p
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            background: "rgba(239, 83, 80, 0.06)",
                            border: "1px solid rgba(239, 83, 80, 0.2)",
                            borderRadius: "10px",
                            fontSize: "13px",
                            color: "#EF5350",
                          }}
                        >
                          {selectedVideo.rejectionReason}
                        </p>
                      </div>
                    )}

                    {showRejectForm ? (
                      <div style={{ marginTop: "8px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            color: "rgba(255,255,255,0.5)",
                            marginBottom: "6px",
                          }}
                        >
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          placeholder="Explain why this video is being rejected..."
                          autoFocus
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "white",
                            fontSize: "13px",
                            outline: "none",
                            resize: "vertical",
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleReject(selectedVideo._id)}
                            disabled={submitting}
                            style={{
                              flex: 1,
                              padding: "11px 16px",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #F44336, #C62828)",
                              border: "none",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "13px",
                              cursor: submitting ? "not-allowed" : "pointer",
                              opacity: submitting ? 0.6 : 1,
                            }}
                          >
                            {submitting ? "Rejecting…" : "Confirm Rejection"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectReason("");
                            }}
                            style={{
                              flex: 1,
                              padding: "11px 16px",
                              borderRadius: "10px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.7)",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : selectedVideo.status === "PENDING" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "8px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleApprove(selectedVideo._id)}
                          disabled={submitting}
                          style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                            border: "none",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.6 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <CheckCircle size={16} />
                          {submitting ? "Approving…" : "Approve"}
                          <kbd
                            style={{
                              fontSize: "10px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background: "rgba(0,0,0,0.3)",
                              marginLeft: "4px",
                            }}
                          >
                            A
                          </kbd>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(true)}
                          style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #F44336, #C62828)",
                            border: "none",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                          <kbd
                            style={{
                              fontSize: "10px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background: "rgba(0,0,0,0.3)",
                              marginLeft: "4px",
                            }}
                          >
                            R
                          </kbd>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(null)}
                        style={{
                          marginTop: "8px",
                          width: "100%",
                          padding: "11px 16px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
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

export default AdminVideos;
