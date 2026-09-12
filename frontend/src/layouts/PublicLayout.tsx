// frontend/src/layouts/PublicLayout.tsx
import { Outlet, Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import { PublicNavbar } from "../components/navigation/PublicNavbar";
import "./PublicLayout.css";

export const PublicLayout = () => {
  return (
    <div className="public-layout">
      {/* Skip link for keyboard users */}
      <a href="#public-main" className="public-skip-link">
        Skip to content
      </a>

      {/* Ambient background layers */}
      <div className="public-layout__grid" aria-hidden="true" />

      <PublicNavbar />

      <main id="public-main" className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div className="public-footer__brand">
            <span className="public-footer__brand-icon" aria-hidden="true">
              <Code2 size={18} />
            </span>
            <span className="public-footer__brand-text">CodeArena</span>
          </div>

          <nav className="public-footer__nav" aria-label="Footer navigation">
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </nav>

          <p className="public-footer__copy">
            © {new Date().getFullYear()} CodeArena. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
