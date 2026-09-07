import React, { useState, useEffect } from "react";
import { Trophy, TrendingUp, Zap } from "lucide-react";

interface Standing {
  participantId: string;
  username: string;
  name: string;
  codeforcesUsername: string;
  group?: string;
  rank: number;
  score: number;
  solved: number;
  penalty: number;
  status: string;
  currentStage: string;
}

export const AdminStandings: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);

  const token = localStorage.getItem("code-arena-token");

  // Get tournament ID from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("tournamentId");
    if (tid) {
      setTournamentId(tid);
      loadGroups(tid);
      loadStandings(tid);
    }
  }, []);

  const loadGroups = async (tId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/tournaments/${tId}/groups`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  };

  const loadStandings = async (tId: string, selectedGroup: string | null = null) => {
    try {
      setLoading(true);
      setError(null);

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/tournaments/${tId}/standings`;
      if (selectedGroup) {
        url += `?group=${selectedGroup}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch standings: ${response.statusText}`);

      const data = await response.json();
      setStandings(data.standings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load standings");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (selectedGroup: string | null) => {
    setGroup(selectedGroup);
    if (tournamentId) {
      loadStandings(tournamentId, selectedGroup);
    }
  };

  if (!tournamentId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No tournament selected. Please select a tournament to view standings.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading standings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Standings
        </h1>
        {groups.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleGroupChange(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                group === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Groups
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => handleGroupChange(g)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  group === g
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Group {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {standings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No standings available</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Participant
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Solved
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Penalty
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {standings.map((standing, index) => (
                <tr
                  key={standing.participantId}
                  className={index === 0 ? "bg-yellow-50" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {standing.rank <= 3 ? (
                        <div className="w-8 h-8 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {standing.rank}
                        </div>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">{standing.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-gray-900">{standing.name}</div>
                    <div className="text-sm text-gray-500">@{standing.username}</div>
                    {standing.codeforcesUsername && (
                      <div className="text-xs text-gray-400">{standing.codeforcesUsername}</div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      {standing.solved}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">
                    {standing.penalty}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{standing.score}</div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        standing.status === "ADVANCED"
                          ? "bg-green-100 text-green-800"
                          : standing.status === "ELIMINATED"
                            ? "bg-red-100 text-red-800"
                            : standing.status === "CHAMPION"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {standing.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
