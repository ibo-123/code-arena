// frontend/src/components/layout/PublicNavbar.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/tournaments", label: "Tournaments" },
    { to: "/bracket", label: "Bracket" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      {/* Glow effect */}
      <div className="navbar-glow" />

      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Zap size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-main">Code</span>
            <span className="brand-accent">Arena</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? "active" : ""}`}
            >
              {link.label}
              {isActive(link.to) && <span className="nav-link-dot" />}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} className="btn-dashboard">
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout" aria-label="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn-register">
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`mobile-link ${isActive(link.to) ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        <div className="mobile-divider" />
        {isAuthenticated ? (
          <>
            <Link
              to={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
              className="mobile-link mobile-dashboard"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button onClick={handleLogout} className="mobile-link mobile-logout">
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mobile-link">
              <LogIn size={16} />
              Login
            </Link>
            <Link to="/register" className="mobile-link mobile-register">
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 0 24px;
          transition: all 0.3s ease;
          background: transparent;
        }

        .navbar-scrolled {
          background: rgba(8, 10, 20, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .navbar-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(41, 121, 255, 0.5),
            transparent
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .navbar-scrolled .navbar-glow {
          opacity: 1;
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 32px;
        }

        /* Brand */
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .navbar-brand:hover {
          transform: scale(1.02);
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.35);
          position: relative;
          overflow: hidden;
        }

        .brand-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
        }

        .brand-text {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .brand-main {
          color: white;
        }

        .brand-accent {
          background: linear-gradient(135deg, #2979FF, #64B5F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Desktop links */
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          position: relative;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-link.active {
          color: white;
          background: rgba(41, 121, 255, 0.1);
        }

        .nav-link-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #2979FF;
          box-shadow: 0 0 8px #2979FF;
        }

        /* Actions */
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .btn-login,
        .btn-register,
        .btn-dashboard {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          white-space: nowrap;
        }

        .btn-login {
          color: rgba(255, 255, 255, 0.75);
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-login:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-register,
        .btn-dashboard {
          color: white;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          box-shadow: 0 4px 16px rgba(41, 121, 255, 0.3);
        }

        .btn-register:hover,
        .btn-dashboard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.45);
        }

        .btn-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 107, 107, 0.08);
          border: 1px solid rgba(255, 107, 107, 0.15);
          color: #FF6B6B;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-logout:hover {
          background: rgba(255, 107, 107, 0.15);
          transform: translateY(-2px);
        }

        /* Mobile toggle */
        .mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mobile-toggle:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        /* Mobile menu */
        .mobile-menu {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 0 24px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.3s ease;
          background: rgba(8, 10, 20, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .mobile-menu.open {
          max-height: 500px;
          padding: 16px 24px 24px;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .mobile-link:hover,
        .mobile-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .mobile-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 8px 0;
        }

        .mobile-dashboard {
          color: #64B5F6;
          background: rgba(41, 121, 255, 0.1);
        }

        .mobile-logout {
          color: #FF6B6B;
          background: rgba(255, 107, 107, 0.08);
        }

        .mobile-register {
          color: white;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .navbar-links,
          .navbar-actions {
            display: none;
          }

          .mobile-toggle {
            display: flex;
          }

          .mobile-menu {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .navbar {
            padding: 0 16px;
          }

          .navbar-inner {
            height: 64px;
          }

          .brand-text {
            font-size: 18px;
          }

          .brand-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </nav>
  );
};

export default PublicNavbar;
