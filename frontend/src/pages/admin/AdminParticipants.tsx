import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import {
  Users,
  Code2,
  RefreshCw,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Crown,
  Star,
  CheckCircle,
  Clock,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import type { Participant } from "../../types";

export const AdminParticipants = () => {
  const { selectedTournament } = useAdmin();
  const tournamentId = selectedTournament?._id;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("seed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ group: string; seed: number }>({
    group: "",
    seed: 1,
  });
  const [saving, setSaving] = useState(false);

  const fetchParticipants = async () => {
    if (!tournamentId) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const { participants: items } = await adminApi.getParticipants(tournamentId);
      setParticipants(items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load participants");
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchParticipants().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEditStart = (p: Participant) => {
    setEditingId(p._id);
    setEditValues({ group: p.group || "", seed: p.seed || 1 });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({ group: "", seed: 1 });
  };

  const handleEditSave = async (participantId: string) => {
    if (!tournamentId) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updateParticipant(tournamentId, participantId, {
        group: editValues.group ? editValues.group.toUpperCase() : undefined,
        seed: editValues.seed,
      });
      await fetchParticipants();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update participant");
    } finally {
      setSaving(false);
    }
  };

  const groups = ["all", ...new Set(participants.map((p) => p.group).filter(Boolean))];
  const statuses = ["all", ...new Set(participants.map((p) => p.status).filter(Boolean))];

  const filteredParticipants = participants
    .filter((p) => {
      const matchesSearch =
        p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.codeforcesUsername?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      const matchesGroup = filterGroup === "all" || p.group === filterGroup;
      return matchesSearch && matchesStatus && matchesGroup;
    })
    .sort((a, b) => {
      let aVal: unknown = a[sortField as keyof Participant];
      let bVal: unknown = b[sortField as keyof Participant];

      if (sortField === "user.name") {
        aVal = a.user?.name || "";
        bVal = b.user?.name || "";
      } else if (sortField === "user.username") {
        aVal = a.user?.username || "";
        bVal = b.user?.username || "";
      } else if (sortField === "user.codeforcesUsername") {
        aVal = a.user?.codeforcesUsername || "";
        bVal = b.user?.codeforcesUsername || "";
      }

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "string" || typeof bVal === "string") {
        const strA = String(aVal);
        const strB = String(bVal);
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

  const totalParticipants = participants.length;
  const activeCount = participants.filter((p) => p.status !== "ELIMINATED").length;
  const championCount = participants.filter((p) => p.status === "CHAMPION").length;
  const groupCount = new Set(participants.map((p) => p.group).filter(Boolean)).size;

  const getStatusTone = (status?: string): "blue" | "gold" | "green" | "red" | "muted" => {
    if (status === "ELIMINATED") return "muted";
    if (status === "CHAMPION") return "gold";
    if (status === "ADVANCED") return "blue";
    if (status === "ACTIVE") return "green";
    return "blue";
  };

  const getStatusIcon = (status?: string) => {
    if (status === "CHAMPION") return <Crown size={14} />;
    if (status === "ELIMINATED") return <Clock size={14} />;
    if (status === "ADVANCED") return <ArrowUp size={14} />;
    return <CheckCircle size={14} />;
  };

  if (!selectedTournament) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState label="No tournament selected. Pick one from the sidebar." />
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading participants directory..." />;
  if (error && !participants.length) return <ErrorState error={error} />;

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
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
            Administrative Management
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
            }}
          >
            Tournament Participants
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            {selectedTournament.name} · {totalParticipants} registered · {activeCount} active
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Badge tone={championCount > 0 ? "gold" : "blue"}>
            {championCount > 0 ? `🏆 ${championCount} Champion` : `${groupCount} Groups`}
          </Badge>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw
              size={16}
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && participants.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(244,67,54,0.1)",
            border: "1px solid rgba(244,67,54,0.2)",
            color: "#FF6B6B",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total", value: totalParticipants, icon: Users, color: "#2979FF" },
          { label: "Active", value: activeCount, icon: CheckCircle, color: "#4CAF50" },
          {
            label: "Eliminated",
            value: totalParticipants - activeCount,
            icon: Clock,
            color: "#FF6B6B",
          },
          { label: "Champions", value: championCount, icon: Crown, color: "#FFD700" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: `${stat.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "white" }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.06)",
              flex: "1",
              minWidth: "150px",
            }}
          >
            <Search size={16} color="rgba(255,255,255,0.3)" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "14px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "4px 8px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Filter size={14} color="rgba(255,255,255,0.3)" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <option value="all">All Statuses</option>
              {statuses
                .filter((s) => s !== "all")
                .map((status) => (
                  <option key={status} value={status} style={{ background: "#1a1f35" }}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "4px 8px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Users size={14} color="rgba(255,255,255,0.3)" />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <option value="all">All Groups</option>
              {groups
                .filter((g) => g !== "all")
                .map((group) => (
                  <option key={group} value={group} style={{ background: "#1a1f35" }}>
                    Group {group}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
            {filteredParticipants.length} participants
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card
        style={{
          padding: 0,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {[
                  { key: "user.name", label: "Participant" },
                  { key: "user.codeforcesUsername", label: "Codeforces" },
                  { key: "group", label: "Group" },
                  { key: "seed", label: "Seed" },
                  { key: "currentStage", label: "Round" },
                  { key: "status", label: "Status" },
                  { key: "_actions", label: "Actions" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== "_actions" && handleSort(col.key)}
                    style={{
                      ...thStyle,
                      cursor: col.key === "_actions" ? "default" : "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {col.label}
                      {col.key !== "_actions" &&
                        sortField === col.key &&
                        (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length ? (
                filteredParticipants.map((p) => {
                  const isChampion = p.status === "CHAMPION";
                  const isEliminated = p.status === "ELIMINATED";
                  const isTopSeed = p.seed && p.seed <= 3;
                  const isEditing = editingId === p._id;

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        background: isChampion
                          ? "rgba(255,215,0,0.03)"
                          : isEliminated
                            ? "rgba(255,255,255,0.01)"
                            : "transparent",
                      }}
                    >
                      {/* Participant */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: isChampion
                                ? "linear-gradient(135deg, #FFD700, #FFA000)"
                                : isEliminated
                                  ? "rgba(255,255,255,0.05)"
                                  : isTopSeed
                                    ? "linear-gradient(135deg, #2979FF, #9C27B0)"
                                    : "rgba(255,255,255,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: isEliminated
                                ? "rgba(255,255,255,0.3)"
                                : isChampion
                                  ? "#0a0e1a"
                                  : "white",
                            }}
                          >
                            {p.user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: isChampion ? "700" : "500",
                                color: isEliminated
                                  ? "rgba(255,255,255,0.3)"
                                  : isChampion
                                    ? "#FFD700"
                                    : "white",
                              }}
                            >
                              {p.user?.name || "Unknown"}
                              {isChampion && (
                                <Crown
                                  size={14}
                                  color="#FFD700"
                                  style={{ marginLeft: "6px", display: "inline" }}
                                />
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: isEliminated
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(255,255,255,0.4)",
                              }}
                            >
                              @{p.user?.username || "unknown"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Codeforces */}
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Code2 size={14} color="rgba(255,255,255,0.2)" />
                          {p.user?.codeforcesUsername || "—"}
                        </div>
                      </td>

                      {/* Group (editable) */}
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.group}
                            onChange={(e) =>
                              setEditValues({ ...editValues, group: e.target.value })
                            }
                            placeholder="A"
                            style={inlineInputStyle}
                          />
                        ) : p.group ? (
                          `Group ${p.group}`
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Seed (editable) */}
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: isTopSeed && !isEliminated ? "700" : "400",
                          color: isEliminated
                            ? "rgba(255,255,255,0.3)"
                            : isTopSeed
                              ? "#FFD700"
                              : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editValues.seed}
                            onChange={(e) =>
                              setEditValues({ ...editValues, seed: Number(e.target.value) })
                            }
                            style={inlineInputStyle}
                          />
                        ) : (
                          <>
                            #{p.seed || "—"}
                            {isTopSeed && !isEliminated && (
                              <Star
                                size={12}
                                color="#FFD700"
                                style={{ marginLeft: "4px", display: "inline" }}
                              />
                            )}
                          </>
                        )}
                      </td>

                      {/* Round */}
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {p.currentStage || "Group Stage"}
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        <Badge tone={getStatusTone(p.status)}>
                          {getStatusIcon(p.status)}
                          {p.status || "ACTIVE"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td style={tdStyle}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => handleEditSave(p._id)}
                              disabled={saving}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: "rgba(76,175,80,0.2)",
                                border: "1px solid rgba(76,175,80,0.4)",
                                color: "#4CAF50",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: saving ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <Save size={12} />
                              {saving ? "..." : "Save"}
                            </button>
                            <button
                              onClick={handleEditCancel}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.6)",
                                fontSize: "11px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStart(p)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "rgba(41,121,255,0.15)",
                              border: "1px solid rgba(41,121,255,0.25)",
                              color: "#64B5F6",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div style={{ padding: "40px" }}>
                      <EmptyState
                        label={
                          searchTerm || filterStatus !== "all" || filterGroup !== "all"
                            ? "No participants match your filters"
                            : "No registered participants yet."
                        }
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ---------- Styles ----------
const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "rgba(255,255,255,0.3)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "500",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "rgba(255,255,255,0.8)",
  verticalAlign: "middle",
};

const inlineInputStyle: React.CSSProperties = {
  width: "70px",
  padding: "4px 8px",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(41,121,255,0.4)",
  color: "white",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

export default AdminParticipants;
