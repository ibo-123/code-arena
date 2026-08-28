import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  FileText,
  Home,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/Badge";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New contest created", time: "5 min ago", read: false },
    {
      id: 2,
      message: "3 participants registered",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "System update completed",
      time: "3 hours ago",
      read: true,
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/contests", label: "Contests", icon: Trophy, badge: "Live" },
    {
      to: "/admin/participants",
      label: "Participants",
      icon: Users,
      badge: "12",
    },
    { to: "/admin/bracket", label: "Bracket", icon: Award },
    { to: "/admin/groups", label: "Groups", icon: Users },
    { to: "/admin/logs", label: "System Logs", icon: FileText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
        color: "white",
      }}
    >
      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: isSidebarOpen ? "280px" : "0px",
          background: "rgba(10, 14, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          zIndex: 1000,
          transition: "width 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              CA
            </div>
            <div>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CodeArena
              </span>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,215,0,0.6)",
                  fontWeight: "600",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Admin Panel
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="sidebar-close-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 12px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "8px 12px",
              marginBottom: "8px",
            }}
          >
            Main Menu
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                color: isActive ? "white" : "rgba(255,255,255,0.6)",
                background: isActive ? "rgba(41,121,255,0.12)" : "transparent",
                border: isActive
                  ? "1px solid rgba(41,121,255,0.15)"
                  : "1px solid transparent",
                transition: "all 0.2s ease",
                marginBottom: "2px",
                position: "relative",
              })}
            >
              <item.icon size={18} />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {item.label}
              </span>
              {item.badge && (
                <Badge
                  tone="red"
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "100px",
                    background: "linear-gradient(135deg, #FF6B6B, #EE4444)",
                  }}
                >
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <NavLink
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                color: "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
              }}
            >
              <Home size={18} />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                Back to Site
              </span>
            </NavLink>
          </div>
        </nav>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "white",
                }}
              >
                {user?.username || "Admin"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Administrator
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                padding: "4px",
                transition: "color 0.2s ease",
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: isSidebarOpen ? "280px" : "0px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          padding: "0",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(10, 14, 26, 0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0 32px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="menu-toggle"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <Menu size={24} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
                padding: "6px 12px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Search size={18} color="rgba(255,255,255,0.3)" />
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Search...
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  padding: "4px",
                  position: "relative",
                }}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#FF6B6B",
                      fontSize: "10px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "320px",
                    background: "rgba(20, 25, 45, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: "12px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    animation: "slideDown 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "white",
                      padding: "4px 8px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      marginBottom: "8px",
                    }}
                  >
                    Notifications
                  </div>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: notif.read
                          ? "transparent"
                          : "rgba(41,121,255,0.05)",
                        marginBottom: "2px",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: notif.read ? "rgba(255,255,255,0.6)" : "white",
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.3)",
                          marginTop: "4px",
                        }}
                      >
                        {notif.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2979FF, #1565C0)",
                border: "none",
                color: "white",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={18} />
              New
            </button>
          </div>
        </header>

        <div
          style={{
            padding: "32px",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <Outlet />
        </div>
      </main>

      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 999,
          }}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (max-width: 1024px) {
          .sidebar-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1025px) {
          .sidebar-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
