import React, { useState, useEffect } from "react";
import { Mail, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { tokens } from "../../styles/designTokens";
import {
  PageHeader,
  Button,
  Alert,
  AdminCard,
  AdminEmptyState,
  globalStyles
} from "../../components/admin/AdminUI";

import { Badge } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";

interface Invitation {
  _id: string;
  participantId: string;
  contestId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  updatedAt: string;
  participant?: {
    user?: {
      name: string;
      username: string;
    };
  };
  contest?: {
    codeforcesContestName: string;
    stage: string;
  };
}

export const AdminInvitations: React.FC = () => {
  const { selectedTournament } = useAdmin();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

  const token = localStorage.getItem("code-arena-token");
  const tournamentId = selectedTournament?._id;

  useEffect(() => {
    if (tournamentId) {
      loadInvitations(tournamentId);
    } else {
      setLoading(false);
    }
  }, [tournamentId, filter]);

  const loadInvitations = async (tId: string) => {
    try {
      setLoading(true);
      setError(null);

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/tournaments/${tId}/invitations`;
      if (filter !== "all") {
        url += `?status=${filter.toUpperCase()}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch invitations: ${response.statusText}`);

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Badge tone="green">
              <CheckCircle size={12} style={{ marginRight: 2 }} /> Accepted
            </Badge>
          </span>
        );
      case "DECLINED":
        return (
          <Badge tone="red">
            <XCircle size={12} style={{ marginRight: 2 }} /> Declined
          </Badge>
        );
      case "PENDING":
        return (
          <Badge tone="gold">
            <Clock size={12} style={{ marginRight: 2 }} /> Pending
          </Badge>
        );
      default:
        return <Badge tone="muted">{status}</Badge>;
    }
  };

  if (!tournamentId) {
    return (
      <div style={{ padding: "24px 0" }}>
        <PageHeader eyebrow="Invitations" title="Contest Invitations" />
        <Alert
          type="warning"
          message="No tournament selected. Please select a tournament to view invitations."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          color: tokens.colors.text.muted,
        }}
      >
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
        Loading invitations...
      </div>
    );
  }

  const filterButtons: Array<"all" | "pending" | "accepted" | "declined"> = [
    "all",
    "pending",
    "accepted",
    "declined",
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      <PageHeader
        eyebrow="Contest Invitations"
        title="Invitation Management"
        subtitle={`${selectedTournament.name} · ${invitations.length} invitation${invitations.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: tokens.colors.bg.card,
                padding: "4px",
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}
            >
              {filterButtons.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: tokens.radius.sm,
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "none",
                    background: filter === status ? tokens.gradients.brand : "transparent",
                    color: filter === status ? "white" : tokens.colors.text.muted,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            <Button onClick={() => loadInvitations(tournamentId)} icon={<RefreshCw size={14} />}>
              Refresh
            </Button>
          </>
        }
      />

      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

      {invitations.length === 0 ? (
        <AdminEmptyState
          icon={<Mail size={32} color="rgba(100,181,246,0.5)" />}
          title="No invitations found"
          description={
            filter === "all"
              ? "Invitations will appear here once contests are published."
              : `No ${filter} invitations match your current filter.`
          }
        />
      ) : (
        <AdminCard padding="0" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                }}
              >
                {["Participant", "Contest", "Stage", "Sent", "Status"].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "14px 20px",
                      textAlign: header === "Status" ? "center" : "left",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: tokens.colors.text.muted,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr
                  key={invitation._id}
                  style={{
                    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: tokens.colors.text.primary,
                      }}
                    >
                      {invitation.participant?.user?.name || "Unknown"}
                    </div>
                    <div style={{ fontSize: "12px", color: tokens.colors.text.muted }}>
                      @{invitation.participant?.user?.username || "unknown"}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "13px",
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    {invitation.contest?.codeforcesContestName || "Unknown"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Badge tone="blue">{invitation.contest?.stage || "—"}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                    }}
                  >
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    {getStatusBadge(invitation.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}

      <style>{globalStyles}</style>
    </div>
  );
};

export default AdminInvitations;
