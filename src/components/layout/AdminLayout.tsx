import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Layers,
  Trophy,
  GitBranch,
  FileText,
  SquareStack,
  LogOut,
} from 'lucide-react'

export const AdminLayout = () => {
  const { logout } = useAuth()

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/participants', icon: Users, label: 'Participants' },
    { path: '/admin/groups', icon: Layers, label: 'Groups & Seeding' },
    { path: '/admin/contests', icon: Trophy, label: 'Codeforces Contests' },
    { path: '/admin/bracket', icon: GitBranch, label: 'Tournament Bracket' },
    { path: '/admin/results', icon: FileText, label: 'Results' },
    { path: '/admin/logs', icon: SquareStack, label: 'System Logs' },
  ]

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">&lt;/&gt;</span>
          <span>CODE ARENA</span>
          <small>Admin</small>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
