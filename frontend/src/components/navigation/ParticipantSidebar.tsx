import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy, Users, Calendar, Mail, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ParticipantSidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/tournaments", label: "My Tournaments", icon: Trophy },
    { to: "/dashboard/standings", label: "Standings", icon: Users },
    { to: "/dashboard/invitations", label: "Invitations", icon: Mail },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">Code Arena</span>
        <span className="sidebar-role">Participant</span>
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
        <div className="sidebar-user">
          <span className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user?.username}</span>
        </div>
        <button onClick={logout} className="sidebar-logout">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};
