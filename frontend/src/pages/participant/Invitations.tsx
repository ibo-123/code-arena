// frontend/src/pages/participant/Invitations.tsx
import { useEffect, useState } from "react";
import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Invitation } from "../../types";

export const Invitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // TODO: Add API call to get invitations
  useEffect(() => {
    // Placeholder - replace with actual API call
    setLoading(false);
  }, []);

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
                <p>You've been invited to a contest</p>
              </div>
              <div className="invitation-status">
                <StatusBadge status={inv.status} />
                <div className="invitation-actions">
                  <button className="btn-primary btn-sm">Accept</button>
                  <button className="btn-outline btn-sm">Decline</button>
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
