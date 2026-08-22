import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/bracket', label: 'Bracket' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/live', label: 'Live' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">&lt;/&gt;</span>
        CODE ARENA <em>2026</em>
      </Link>

      <nav>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={isActive(item.path) ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <span className="live-dot" />
        <span className="user-label">LIVE</span>

        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="user-label">
              {user?.username}
            </Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="user-label">
                Admin
              </Link>
            )}
            <button className="text-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Register</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
