import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  GitBranch,
  Layers,
  FileText,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Sparkles,
  Crown,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  currentStage?: string;
  maxParticipants?: number;
  numberOfGroups?: number;
}

// Type for the outlet context
export interface AdminLayoutContext {
  selectedTournament: Tournament | null;
  tournaments: Tournament[];
}

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showTournamentMenu, setShowTournamentMenu] = useState(false);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const response = await tournamentApi.list();
        const allTournaments = response?.tournaments || [];
        setTournaments(allTournaments);

        if (allTournaments.length > 0) {
          const savedId = localStorage.getItem("admin-selected-tournament");
          const savedTournament = savedId
            ? allTournaments.find((t: Tournament) => t._id === savedId)
            : null;
          const tournament = savedTournament || allTournaments[0];
          setSelectedTournament(tournament);
          if (!savedTournament) {
            localStorage.setItem("admin-selected-tournament", tournament._id);
          }
        } else {
          setSelectedTournament(null);
          localStorage.removeItem("admin-selected-tournament");
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
        setTournaments([]);
        setSelectedTournament(null);
      }
    };

    loadTournaments();
  }, [location.pathname]);

  const handleTournamentChange = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    localStorage.setItem("admin-selected-tournament", tournament._id);
    setShowTournamentMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Contests", path: "/admin/contests", icon: Trophy },
    { label: "Participants", path: "/admin/participants", icon: Users },
    { label: "Bracket", path: "/admin/bracket", icon: GitBranch },
    { label: "Groups", path: "/admin/groups", icon: Layers },
    { label: "Logs", path: "/admin/logs", icon: FileText },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "280px",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f172a 0%, #1a2332 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <Link
            to="/admin"
            style={{
              textDecoration: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "20px",
                boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                position: "relative",
              }}
            >
              CA
              <Sparkles
                size={14}
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  color: "#fbbf24",
                  opacity: 0.8,
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  background: "linear-gradient(135deg, #fff 60%, #94a3b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Code Arena
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "2px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Tournament selector */}
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            Active Tournament
          </div>

          {tournaments.length > 0 ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowTournamentMenu(!showTournamentMenu)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#f1f5f9",
                    }}
                  >
                    {selectedTournament?.name || "Select Tournament"}
                  </div>
                  {selectedTournament?.status && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#94a3b8",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background:
                            selectedTournament.status === "ACTIVE" ||
                            selectedTournament.status === "REGISTRATION"
                              ? "#22c55e"
                              : selectedTournament.status === "COMPLETED"
                                ? "#3b82f6"
                                : "#f59e0b",
                        }}
                      />
                      {selectedTournament.status}
                    </div>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#94a3b8",
                    transition: "transform 0.2s ease",
                    transform: showTournamentMenu ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {showTournamentMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 100,
                    maxHeight: "280px",
                    overflowY: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  }}
                >
                  {tournaments.map((tournament) => (
                    <button
                      key={tournament._id}
                      onClick={() => handleTournamentChange(tournament)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: "none",
                        background:
                          selectedTournament?._id === tournament._id
                            ? "rgba(59,130,246,0.2)"
                            : "transparent",
                        color: "white",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                        borderLeft:
                          selectedTournament?._id === tournament._id
                            ? "3px solid #3b82f6"
                            : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTournament?._id !== tournament._id) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTournament?._id !== tournament._id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: selectedTournament?._id === tournament._id ? "#60a5fa" : "#f1f5f9",
                        }}
                      >
                        {tournament.name}
                      </div>
                      {tournament.status && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            marginTop: "4px",
                          }}
                        >
                          {tournament.status}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
                color: "#64748b",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              <Crown size={20} style={{ margin: "0 auto 6px", opacity: 0.3 }} />
              No tournaments yet
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "20px 12px",
            overflowY: "auto",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  marginBottom: "4px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive ? "white" : "#94a3b8",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15))"
                    : "transparent",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s ease",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom sidebar actions */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={() => navigate("/admin/tournaments/create")}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
            }}
          >
            <Plus size={18} />
            New Tournament
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA - Dark theme */}
      <main
        style={{
          marginLeft: "280px",
          width: "calc(100% - 280px)",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Top header - Dark */}
        <header
          style={{
            height: "80px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
              }}
            >
              Admin Dashboard
            </h1>
            {selectedTournament && (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: selectedTournament.status === "COMPLETED" ? "#3b82f6" : "#22c55e",
                  }}
                />
                {selectedTournament.name}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/admin/tournaments/create")}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
              }}
            >
              <Plus size={18} />
              New Tournament
            </button>
          </div>
        </header>

        {/* Content area - Dark theme */}
        <div
          style={{
            padding: "32px 40px",
            maxWidth: "1440px",
            margin: "0 auto",
            background: "var(--bg-primary)",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <Outlet
            context={{
              selectedTournament,
              tournaments,
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
