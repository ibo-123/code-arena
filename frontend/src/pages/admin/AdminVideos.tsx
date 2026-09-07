import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";
import type { VideoSubmission } from "../../types";

interface VideoWithDetails extends VideoSubmission {
  participant?: {
    user?: {
      name: string;
      username: string;
      codeforcesUsername?: string;
    };
  };
  contest?: {
    codeforcesContestName: string;
  };
}

export const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedVideo, setSelectedVideo] = useState<VideoWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const token = localStorage.getItem("code-arena-token");

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = filter === "all" ? "" : `?status=${filter.toUpperCase()}`;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/videos${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error(`Failed to fetch videos: ${response.statusText}`);

      const data = await response.json();
      setVideos(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/videos/${submissionId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to approve video");

      setSelectedVideo(null);
      setShowRejectForm(false);
      fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve video");
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/videos/${submissionId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason || "No reason provided" }),
        },
      );

      if (!response.ok) throw new Error("Failed to reject video");

      setSelectedVideo(null);
      setShowRejectForm(false);
      setRejectReason("");
      fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject video");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1";
    switch (status) {
      case "APPROVED":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="w-4 h-4" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="w-4 h-4" /> Rejected
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Video Reviews</h1>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
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

      {videos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No videos found</p>
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {videos.map((video) => (
                <tr key={video._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {video.participant?.user?.name}
                    </div>
                    <div className="text-sm text-gray-500">{video.participant?.user?.username}</div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {video.contest?.codeforcesContestName || "Unknown"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">{getStatusBadge(video.status)}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Review Video Submission</h2>
              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <strong>Participant:</strong> {selectedVideo.participant?.user?.name} (
                  {selectedVideo.participant?.user?.username})
                </p>
                <p>
                  <strong>Contest:</strong> {selectedVideo.contest?.codeforcesContestName}
                </p>
                <p>
                  <strong>Status:</strong> {selectedVideo.status}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                <a
                  href={selectedVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 break-all"
                >
                  {selectedVideo.videoUrl}
                </a>
              </div>

              {selectedVideo.note && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Note
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedVideo.note}</p>
                </div>
              )}

              {selectedVideo.status === "REJECTED" && selectedVideo.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <p className="text-red-700 bg-red-50 p-3 rounded">
                    {selectedVideo.rejectionReason}
                  </p>
                </div>
              )}

              {!showRejectForm && selectedVideo.status === "PENDING" && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedVideo._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this video is being rejected..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(selectedVideo._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showRejectForm && selectedVideo.status !== "PENDING" && (
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
