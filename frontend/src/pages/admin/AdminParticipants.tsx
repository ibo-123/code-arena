import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui";
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
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Participant } from "../../types";

export const AdminParticipants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("seed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchParticipants = async () => {
    try {
      const { tournaments } = await tournamentApi.list();
      const t = tournaments[0];
      if (!t) return { participants: [] };
      const { participants: items } = await tournamentApi.participants(t._id);
      setParticipants(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load participants",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchParticipants()
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

  const groups = [
    "all",
    ...new Set(participants.map((p) => p.group).filter(Boolean)),
  ];
  const statuses = [
    "all",
    ...new Set(participants.map((p) => p.status).filter(Boolean)),
  ];

  const filteredParticipants = participants
    .filter((p) => {
      const matchesSearch =
        p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.codeforcesUsername
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      const matchesGroup = filterGroup === "all" || p.group === filterGroup;
      return matchesSearch && matchesStatus && matchesGroup;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof Participant];
      let bVal: any = b[sortField as keyof Participant];

      if (sortField === "user.name") {
        aVal = a.user?.name || "";
        bVal = b.user?.name || "";
      } else if (sortField === "user.username") {
        aVal = a.user?.username || "";
        bVal = b.user?.username || "";
      }

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  const totalParticipants = participants.length;
  const activeCount = participants.filter(
    (p) => p.status !== "ELIMINATED",
  ).length;
  const championCount = participants.filter(
    (p) => p.status === "CHAMPION",
  ).length;
  const groupCount = new Set(participants.map((p) => p.group).filter(Boolean))
    .size;

  const getStatusTone = (
    status?: string,
  ): "blue" | "gold" | "green" | "red" | "muted" => {
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

  if (loading)
    return <LoadingState label="Loading participants directory..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div style={{ padding: "24px 0" }}>
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
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            {totalParticipants} registered participants · {activeCount} active
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Badge tone={championCount > 0 ? "gold" : "blue"}>
            {championCount > 0
              ? `🏆 ${championCount} Champion`
              : `${groupCount} Groups`}
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
              transition: "all 0.3s ease",
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Total",
            value: totalParticipants,
            icon: Users,
            color: "#2979FF",
          },
          {
            label: "Active",
            value: activeCount,
            icon: CheckCircle,
            color: "#4CAF50",
          },
          {
            label: "Eliminated",
            value: totalParticipants - activeCount,
            icon: Clock,
            color: "#FF6B6B",
          },
          {
            label: "Champions",
            value: championCount,
            icon: Crown,
            color: "#FFD700",
          },
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
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "white",
                }}
              >
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

      <Card
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
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
                padding: "4px 4px",
              }}
            >
              <option value="all">All Statuses</option>
              {statuses
                .filter((s) => s !== "all")
                .map((status) => (
                  <option
                    key={status}
                    value={status}
                    style={{ background: "#1a1f35" }}
                  >
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
                padding: "4px 4px",
              }}
            >
              <option value="all">All Groups</option>
              {groups
                .filter((g) => g !== "all")
                .map((group) => (
                  <option
                    key={group}
                    value={group}
                    style={{ background: "#1a1f35" }}
                  >
                    Group {group}
                  </option>
                ))}
            </select>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.3)",
              marginLeft: "auto",
            }}
          >
            {filteredParticipants.length} participants
          </div>
        </div>
      </Card>

      <Card
        style={{
          padding: "0",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
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
                  { key: "currentRound", label: "Round" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...thStyle,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {col.label}
                      {sortField === col.key &&
                        (sortDirection === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length ? (
                filteredParticipants.map((p, index) => {
                  const isChampion = p.status === "CHAMPION";
                  const isEliminated = p.status === "ELIMINATED";
                  const isTopSeed = p.seed && p.seed <= 3;

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        transition: "background 0.2s ease",
                        background: isChampion
                          ? "rgba(255,215,0,0.03)"
                          : isEliminated
                            ? "rgba(255,255,255,0.01)"
                            : "transparent",
                      }}
                    >
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
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
                                  style={{
                                    marginLeft: "6px",
                                    display: "inline",
                                  }}
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
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(255,255,255,0.7)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Code2 size={14} color="rgba(255,255,255,0.2)" />
                          {p.user?.codeforcesUsername || "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {p.group ? `Group ${p.group}` : "—"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            isTopSeed && !isEliminated ? "700" : "400",
                          color: isEliminated
                            ? "rgba(255,255,255,0.3)"
                            : isTopSeed
                              ? "#FFD700"
                              : "rgba(255,255,255,0.7)",
                        }}
                      >
                        #{p.seed || "—"}
                        {isTopSeed && !isEliminated && (
                          <Star
                            size={12}
                            color="#FFD700"
                            style={{ marginLeft: "4px", display: "inline" }}
                          />
                        )}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: isEliminated
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {p.currentRound || "Group Stage"}
                      </td>
                      <td style={tdStyle}>
                        <Badge tone={getStatusTone(p.status)}>
                          {getStatusIcon(p.status)}
                          {p.status || "ACTIVE"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: "40px" }}>
                      <EmptyState
                        label={
                          searchTerm ||
                          filterStatus !== "all" ||
                          filterGroup !== "all"
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

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

export default AdminParticipants;
