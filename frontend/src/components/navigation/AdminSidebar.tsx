import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Video,
  BarChart3,
  GitBranch,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AdminSidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/tournaments", label: "Tournaments", icon: Trophy },
    { to: "/admin/tournaments/current/participants", label: "Participants", icon: Users },
    { to: "/admin/tournaments/current/contests", label: "Contests", icon: Calendar },
    { to: "/admin/tournaments/current/videos", label: "Video Reviews", icon: Video },
    { to: "/admin/tournaments/current/standings", label: "Standings", icon: BarChart3 },
    { to: "/admin/tournaments/current/bracket", label: "Bracket", icon: GitBranch },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">Code Arena</span>
        <span className="sidebar-role admin">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="sidebar-logout">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};
