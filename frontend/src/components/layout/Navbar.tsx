import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  Settings,
  Trophy,
  Home,
  Calendar,
  LayoutDashboard,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ... rest of the component remains the same

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/bracket", label: "Bracket", icon: Trophy },
    { to: "/live", label: "Live", icon: Calendar },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(10, 14, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "0 40px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          color: "white",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2979FF, #9C27B0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span style={{ position: "relative", zIndex: 1 }}>CA</span>
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
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
          <span
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.3)",
              display: "block",
              marginTop: "-2px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Championship
          </span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Desktop Links - using media query via className instead of inline style */}
        <div className="desktop-nav-links">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                textDecoration: "none",
                color: isActive(to) ? "white" : "rgba(255,255,255,0.6)",
                fontWeight: isActive(to) ? "600" : "500",
                fontSize: "14px",
                background: isActive(to)
                  ? "rgba(41,121,255,0.15)"
                  : "transparent",
                border: isActive(to)
                  ? "1px solid rgba(41,121,255,0.2)"
                  : "1px solid transparent",
                transition: "all 0.3s ease",
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* User Section */}
        {user ? (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 12px 6px 6px",
                borderRadius: "100px",
                background: isProfileDropdownOpen
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                color: "white",
                transition: "all 0.3s ease",
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
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span
                className="username-text"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {user.username}
              </span>
              <ChevronDown
                size={16}
                style={{
                  opacity: 0.6,
                  transition: "transform 0.3s ease",
                  transform: isProfileDropdownOpen
                    ? "rotate(180deg)"
                    : "rotate(0)",
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "220px",
                  background: "rgba(20, 25, 45, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "8px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  animation: "slideDown 0.2s ease",
                }}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: "12px 12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "white",
                    }}
                  >
                    {user.username}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {user.email || "participant@codearena.dev"}
                  </div>
                </div>

                {/* Menu Items */}
                <Link
                  to="/profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Settings size={18} />
                  <span>Profile Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "#FF6B6B",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,107,107,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Link to="/login">
              <button
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <LogIn size={16} />
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button
                style={{
                  padding: "8px 24px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2979FF, #1565C0)",
                  border: "none",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Register
              </button>
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-toggle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: "72px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 14, 26, 0.98)",
            backdropFilter: "blur(20px)",
            padding: "24px",
            animation: "fadeIn 0.3s ease",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive(to) ? "white" : "rgba(255,255,255,0.7)",
                  fontWeight: isActive(to) ? "600" : "500",
                  fontSize: "16px",
                  background: isActive(to)
                    ? "rgba(41,121,255,0.12)"
                    : "transparent",
                  border: isActive(to)
                    ? "1px solid rgba(41,121,255,0.15)"
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
                {isActive(to) && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#2979FF",
                    }}
                  />
                )}
              </Link>
            ))}

            {user && (
              <>
                <div
                  style={{
                    margin: "12px 0 4px",
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Signed in as
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    {user.username}
                  </div>
                </div>

                <Link
                  to="/profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "16px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Settings size={20} />
                  <span>Profile Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "#FF6B6B",
                    fontSize: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSS Styles - Using className for media queries */}
      <style>{`
        /* Desktop navigation links - visible on md and up */
        .desktop-nav-links {
          display: none;
        }
        
        /* Mobile menu toggle - visible on smaller screens */
        .mobile-menu-toggle {
          display: flex !important;
        }

        /* Responsive breakpoints */
        @media (min-width: 768px) {
          .desktop-nav-links {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .mobile-menu-toggle {
            display: none !important;
          }
        }

        @media (min-width: 640px) {
          .username-text {
            display: inline;
          }
        }

        @media (max-width: 640px) {
          .username-text {
            display: none;
          }
        }

        @media (max-width: 768px) {
          nav {
            padding: 0 16px !important;
          }
        }

        @media (max-width: 480px) {
          nav {
            padding: 0 12px !important;
          }
        }

        /* Animations */
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Hover effects */
        .desktop-nav-links a:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        button:hover {
          opacity: 0.8;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
