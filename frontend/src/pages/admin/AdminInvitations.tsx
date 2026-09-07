import React, { useState, useEffect } from "react";
import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";

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
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [tournamentId, setTournamentId] = useState("");

  const token = localStorage.getItem("code-arena-token");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("tournamentId");
    if (tid) {
      setTournamentId(tid);
      loadInvitations(tid);
    }
  }, []);

  useEffect(() => {
    if (tournamentId) {
      loadInvitations(tournamentId);
    }
  }, [filter]);

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
    const baseClasses = "px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1";
    switch (status) {
      case "ACCEPTED":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="w-4 h-4" /> Accepted
          </span>
        );
      case "DECLINED":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="w-4 h-4" /> Declined
          </span>
        );
      case "PENDING":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="w-4 h-4" /> Pending
          </span>
        );
      default:
        return <span className={baseClasses}>{status}</span>;
    }
  };

  if (!tournamentId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No tournament selected. Please select a tournament to view invitations.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading invitations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-500" />
          Contest Invitations
        </h1>
        <div className="flex gap-2">
          {(["all", "pending", "accepted", "declined"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No invitations found</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contest</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stage</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sent</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {invitation.participant?.user?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{invitation.participant?.user?.username}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {invitation.contest?.codeforcesContestName || "Unknown"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {invitation.contest?.stage}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-center">{getStatusBadge(invitation.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
