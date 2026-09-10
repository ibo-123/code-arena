import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Code Arena</span>
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/tournaments">Tournaments</Link>
        <Link to="/tournaments">Bracket</Link>
      </div>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <Link to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} className="btn-primary">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="btn-outline">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-outline">
              <LogIn size={16} />
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
