// frontend/src/pages/participant/Invitations.tsx
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="invitations-page">
      <div className="page-header">
        <h1>Invitations</h1>
        <p>Contest invitations from tournaments</p>
      </div>

      {invitations.length > 0 ? (
        <div className="invitations-list">
          {invitations.map((inv) => (
            <div key={inv._id} className="invitation-card">
              <div className="invitation-info">
                <h3>Contest Invitation</h3>
                <p>You've been invited to participate in a contest</p>
              </div>
              <div className="invitation-status">
                <StatusBadge status={inv.status} />
                <div className="invitation-actions">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleRespond(inv._id, "ACCEPTED")}
                    disabled={responding === inv._id}
                  >
                    {responding === inv._id ? "..." : "Accept"}
                  </button>
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => handleRespond(inv._id, "DECLINED")}
                    disabled={responding === inv._id}
                  >
                    {responding === inv._id ? "..." : "Decline"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Mail size={48} />
          <h3>No invitations</h3>
          <p>You don't have any pending contest invitations</p>
        </div>
      )}
    </div>
  );
};

export default Invitations;
