// frontend/src/pages/participant/Invitations.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Check,
  X,
  Sparkles,
  Swords,
  Calendar,
  ExternalLink,
  Inbox,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingState, ErrorState } from "../../components/common";
import { tournamentApi } from "../../services/tournamentApi";
import { contestApi } from "../../services/contestApi";
import { useAuth } from "../../context/AuthContext";
import type { Contest } from "../../types";

interface PendingContest {
  contest: Contest;
  tournament: {
    _id: string;
    name: string;
  };
}

export const Invitations = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declined, setDeclined] = useState<Set<string>>(new Set());

  // ---- Load pending contests -----------------------------------------
  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");

    try {
      // 1. Get the user's approved tournaments
      //    Backend shape: { tournaments: (Participant & { tournament: Tournament })[] }
      const res = await tournamentApi.getMyTournaments();
      const myTournaments = res.tournaments || [];

      const approved = myTournaments.filter((t) => t.registrationStatus === "APPROVED");

      // 2. For each approved tournament, fetch its visible contests
      //    and keep only those the participant hasn't confirmed yet.
      const collected: PendingContest[] = [];

      for (const t of approved) {
        // The nested tournament document — read the id and name from it
        const tournamentDoc = t.tournament;
        const tournamentId = tournamentDoc?._id;
        if (!tournamentId) continue;

        try {
          const { contests } = await contestApi.getMyContests(tournamentId);

          for (const c of contests || []) {
            if (declined.has(c._id)) continue;

            const participation = await contestApi.getMyParticipation(c._id).catch(() => null);

            const confirmed = participation?.confirmedJoined ?? false;
            if (confirmed) continue;

            collected.push({
              contest: c,
              tournament: {
                _id: tournamentId,
                name: tournamentDoc.name || "Tournament",
              },
            });
          }
        } catch {
          // Skip tournaments we can't read
          continue;
        }
      }

      setPending(collected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, [user?._id, declined]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Accept (confirm joined) ----------------------------------------
  const handleAccept = async (contestId: string) => {
    setAccepting(contestId);
    setError("");
    try {
      await contestApi.confirmJoined(contestId);
      setPending((prev) => prev.filter((p) => p.contest._id !== contestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm join");
    } finally {
      setAccepting(null);
    }
  };

  // ---- Decline (hide locally only) ------------------------------------
  const handleDecline = (contestId: string) => {
    setDeclined((prev) => new Set(prev).add(contestId));
    setPending((prev) => prev.filter((p) => p.contest._id !== contestId));
  };

  // ---- Helpers --------------------------------------------------------
  const getStatusLabel = (contest: Contest): string => {
    const s = String(contest.status || "PUBLISHED").toUpperCase();
    if (s === "LIVE") return "LIVE";
    if (s === "FINISHED") return "FINISHED";
    if (s === "UPCOMING") return "UPCOMING";
    if (s === "PUBLISHED") return "PUBLISHED";
    return s;
  };

  const getStatusClass = (contest: Contest): string => {
    const s = String(contest.status || "PUBLISHED").toUpperCase();
    if (s === "LIVE") return "status-live";
    if (s === "FINISHED") return "status-finished";
    return "status-upcoming";
  };

  const count = pending.length;

  // ---- Render ---------------------------------------------------------
  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading invitations..." />;
  }
  if (error && pending.length === 0) return <ErrorState error={error} />;

  return (
    <div className="invitations-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <Inbox size={24} />
          </div>
          <div>
            <h1>Invitations</h1>
            <p className="subtitle">
              {count > 0
                ? `You have ${count} contest${count > 1 ? "s" : ""} to join`
                : "Contests you're eligible for will appear here"}
            </p>
          </div>
          {count > 0 && (
            <div className="header-count-badge">
              <Sparkles size={14} />
              {count} Pending
            </div>
          )}
        </div>
      </div>

      {error && pending.length > 0 && <div className="inline-error">{error}</div>}

      {pending.length > 0 ? (
        <div className="invitations-list">
          {pending.map(({ contest, tournament }) => {
            const isAccepting = accepting === contest._id;
            const statusLabel = getStatusLabel(contest);
            const statusClass = getStatusClass(contest);

            return (
              <div key={contest._id} className="invitation-card">
                <div className="card-glow" />
                <div className="card-accent" />

                <div className="invitation-icon">
                  <Swords size={24} />
                </div>

                <div className="invitation-content">
                  <div className="invitation-title-row">
                    <h3>{contest.name || "Contest"}</h3>
                    <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                  </div>

                  <p className="invitation-message">
                    You're invited to participate in <strong>{tournament.name}</strong>. Open the
                    invitation link on Codeforces to join the contest, then click Accept.
                  </p>

                  <div className="invitation-meta">
                    <span className="meta-pill">
                      <Trophy size={12} />
                      {tournament.name}
                    </span>
                    {contest.startTime && (
                      <span className="meta-pill">
                        <Calendar size={12} />
                        {new Date(contest.startTime).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {contest.invitationUrl && (
                    <a
                      href={contest.invitationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="invitation-link"
                    >
                      <ExternalLink size={12} />
                      <span>Open on Codeforces</span>
                    </a>
                  )}
                </div>

                <div className="invitation-actions">
                  <button
                    type="button"
                    className="btn-accept"
                    onClick={() => handleAccept(contest._id)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <span className="btn-loading" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-decline"
                    onClick={() => handleDecline(contest._id)}
                    disabled={isAccepting}
                  >
                    <X size={16} />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckCircle size={48} />
          </div>
          <h3>You're all caught up</h3>
          <p>
            No pending contest invitations right now. When a new contest is published for your
            group, it will appear here.
          </p>
          <Link to="/dashboard/tournaments" className="empty-cta">
            <Trophy size={16} />
            <span>Browse My Tournaments</span>
          </Link>
        </div>
      )}

      <style>{`
        .invitations-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        .page-header {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .page-header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2979FF, #9C27B0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.3);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .header-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          margin-left: auto;
          border-radius: 100px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          color: #FFD700;
          font-size: 13px;
          font-weight: 700;
        }

        .inline-error {
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(239, 83, 80, 0.1);
          border: 1px solid rgba(239, 83, 80, 0.25);
          color: #EF5350;
          font-size: 13px;
        }

        .invitations-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .invitation-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px 28px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: transform 0.35s ease, background-color 0.35s ease,
            border-color 0.35s ease, box-shadow 0.35s ease;
          overflow: hidden;
          isolation: isolate;
        }

        .card-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(156, 39, 176, 0.12), transparent 70%);
          filter: blur(60px);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .card-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(180deg, #2979FF, #9C27B0);
          opacity: 0.7;
        }

        .invitation-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(41, 121, 255, 0.2);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
        }

        .invitation-card:hover .card-glow {
          opacity: 1;
        }

        .invitation-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.15), rgba(156, 39, 176, 0.15));
          border: 1px solid rgba(41, 121, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .invitation-card:hover .invitation-icon {
          transform: scale(1.05) rotate(-3deg);
        }

        .invitation-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .invitation-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .invitation-title-row h3 {
          font-size: 17px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-live {
          background: rgba(239, 83, 80, 0.12);
          border: 1px solid rgba(239, 83, 80, 0.25);
          color: #EF5350;
        }

        .status-upcoming {
          background: rgba(41, 121, 255, 0.12);
          border: 1px solid rgba(41, 121, 255, 0.25);
          color: #64B5F6;
        }

        .status-finished {
          background: rgba(76, 175, 80, 0.12);
          border: 1px solid rgba(76, 175, 80, 0.25);
          color: #4CAF50;
        }

        .invitation-message {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
          line-height: 1.55;
        }

        .invitation-message strong {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }

        .invitation-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          font-weight: 600;
        }

        .invitation-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.2);
          color: #64B5F6;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }

        .invitation-link:hover {
          background: rgba(41, 121, 255, 0.15);
        }

        .invitation-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
          align-self: center;
        }

        .btn-accept,
        .btn-decline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 100px;
          height: 42px;
          padding: 0 18px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.3s ease, background-color 0.3s ease,
            border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
          border: none;
          font-family: inherit;
        }

        .btn-accept {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
        }

        .btn-accept:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(76, 175, 80, 0.4);
        }

        .btn-decline {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        .btn-decline:hover:not(:disabled) {
          background: rgba(239, 83, 80, 0.08);
          border-color: rgba(239, 83, 80, 0.3);
          color: #EF5350;
          transform: translateY(-2px);
        }

        .btn-accept:disabled,
        .btn-decline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 16px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 24px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .empty-icon {
          width: 88px;
          height: 88px;
          border-radius: 28px;
          background: rgba(76, 175, 80, 0.06);
          border: 1px solid rgba(76, 175, 80, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4CAF50;
          margin-bottom: 8px;
        }

        .empty-state h3 {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }

        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .empty-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(41, 121, 255, 0.35);
        }

        @media (max-width: 768px) {
          .invitation-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 20px;
          }

          .invitation-icon {
            width: 48px;
            height: 48px;
          }

          .invitation-actions {
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            align-self: stretch;
          }

          .btn-accept,
          .btn-decline {
            flex: 1;
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .page-header {
            padding: 24px;
          }

          .page-header h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 48px;
            height: 48px;
          }

          .header-count-badge {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .invitation-card,
          .invitation-card .card-glow,
          .invitation-card .invitation-icon,
          .btn-accept,
          .btn-decline,
          .empty-cta {
            transition: none;
          }

          .btn-loading {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Invitations;
