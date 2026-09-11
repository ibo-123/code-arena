// frontend/src/pages/participant/Invitations.tsx
import { useEffect, useState } from "react";
import { Mail, Check, X, Sparkles, Swords, Calendar, Users, Inbox } from "lucide-react";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import { invitationApi } from "../../services/invitationApi";
import type { Invitation } from "../../types";

export const Invitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await invitationApi.getMyInvitations("PENDING");
        setInvitations(response.invitations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitations");
      } finally {
        setLoading(false);
      }
    };
    loadInvitations();
  }, []);

  const handleRespond = async (invitationId: string, status: "ACCEPTED" | "DECLINED") => {
    try {
      setResponding(invitationId);
      await invitationApi.respondToInvitation(invitationId, status);
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to invitation");
    } finally {
      setResponding(null);
    }
  };

  if (loading) return <LoadingState variant="spinner" size="lg" label="Loading invitations..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="invitations-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <Mail size={24} />
          </div>
          <div>
            <h1>Invitations</h1>
            <p className="subtitle">
              {invitations.length > 0
                ? `You have ${invitations.length} pending invitation${invitations.length > 1 ? "s" : ""}`
                : "Contest invitations from tournaments will appear here"}
            </p>
          </div>
          {invitations.length > 0 && (
            <div className="header-count-badge">
              <Sparkles size={14} />
              {invitations.length} New
            </div>
          )}
        </div>
      </div>

      {invitations.length > 0 ? (
        <div className="invitations-list">
          {invitations.map((inv) => {
            const isResponding = responding === inv._id;

            return (
              <div key={inv._id} className="invitation-card">
                <div className="card-glow" />
                <div className="card-accent" />

                {/* Left icon */}
                <div className="invitation-icon">
                  <Swords size={24} />
                </div>

                {/* Main content */}
                <div className="invitation-content">
                  <div className="invitation-title-row">
                    <h3>Contest Invitation</h3>
                    <StatusBadge status={inv.status} size="sm" />
                  </div>

                  <p className="invitation-message">
                    You've been invited to participate in a contest
                  </p>

                  <div className="invitation-meta">
                    <span className="meta-pill">
                      <Calendar size={12} />
                      Just now
                    </span>
                    <span className="meta-pill">
                      <Users size={12} />
                      Contest slot
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="invitation-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleRespond(inv._id, "ACCEPTED")}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <span className="btn-loading" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleRespond(inv._id, "DECLINED")}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <span className="btn-loading" />
                    ) : (
                      <>
                        <X size={16} />
                        <span>Decline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Inbox size={48} />
          </div>
          <h3>No invitations</h3>
          <p>
            You don't have any pending contest invitations. They'll show up here when you receive
            one.
          </p>
        </div>
      )}

      <style>{`
        .invitations-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        /* ============================================
           HEADER
        ============================================ */
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
          animation: subtlePulse 2s ease-in-out infinite;
        }

        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
        }

        /* ============================================
           INVITATIONS LIST
        ============================================ */
        .invitations-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .invitation-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 28px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
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
          gap: 8px;
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

        .invitation-message {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.5;
        }

        .invitation-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
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

        /* ============================================
           ACTIONS
        ============================================ */
        .invitation-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
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
          transition: all 0.3s ease;
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

        /* ============================================
           EMPTY STATE
        ============================================ */
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
          background: rgba(41, 121, 255, 0.06);
          border: 1px solid rgba(41, 121, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
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

        /* ============================================
           RESPONSIVE
        ============================================ */
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
      `}</style>
    </div>
  );
};

export default Invitations;
