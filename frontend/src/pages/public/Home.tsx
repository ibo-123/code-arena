// frontend/src/pages/public/Home.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Crown,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState, ErrorState } from "../../components/common";
import { Badge } from "../../components/ui/Badge";
import type { Tournament } from "../../types";

export const Home = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => setTournaments(tournaments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Countdown timer for featured tournament
  useEffect(() => {
    const featured = tournaments.find(
      (t) => t.status === "REGISTRATION" || t.status === "GROUP_STAGE",
    );
    if (!featured?.tournamentStart) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(featured.tournamentStart!).getTime();
      const diff = start - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [tournaments]);

  const active = tournaments.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const featured = active.length > 0 ? active[0] : null;
  const isCountdownZero =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="public-home">
      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section className="hero-section">
        {/* Animated Background Glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            Championship Series 2026
          </div>

          <h1>
            Code Arena
            <span className="hero-year">2026</span>
          </h1>

          <p className="hero-subtitle">
            Elite competitive programming tournament where coders battle for the ultimate crown.
            <span className="highlight"> $10,000 Prize Pool</span>
          </p>

          <div className="hero-actions">
            <Link to="/tournaments" className="btn-primary btn-large">
              View Tournaments
              <ArrowRight size={20} />
            </Link>
            <Link to="/bracket" className="btn-secondary btn-large">
              <Trophy size={20} />
              View Bracket
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <Users size={20} />
              <span>
                <strong>{active.reduce((sum, t) => sum + (t.participantCount || 0), 0)}</strong>
                <span className="stat-label">Competitors</span>
              </span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <Trophy size={20} />
              <span>
                <strong>{active.length}</strong>
                <span className="stat-label">Active Tournaments</span>
              </span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <TrendingUp size={20} />
              <span>
                <strong>32</strong>
                <span className="stat-label">Contests</span>
              </span>
            </div>
          </div>
        </div>

        {/* Featured Tournament Card */}
        {featured && (
          <div className="hero-featured">
            <div className="featured-card">
              <div className="featured-header">
                <div className="featured-status">
                  <span
                    className={`status-dot ${featured.status === "REGISTRATION" ? "registration" : "live"}`}
                  />
                  {featured.status === "REGISTRATION"
                    ? "Registration Open"
                    : featured.status === "GROUP_STAGE"
                      ? "Group Stage"
                      : "Live"}
                </div>
                <Badge tone="gold" size="sm">
                  Featured
                </Badge>
              </div>

              <h3>{featured.name}</h3>
              <p className="featured-description">
                {featured.description || "Join the ultimate coding competition"}
              </p>

              {/* Countdown */}
              {!isCountdownZero && featured.tournamentStart && (
                <div className="featured-countdown">
                  <div className="countdown-item">
                    <span className="countdown-value">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <span className="countdown-separator">:</span>
                  <div className="countdown-item">
                    <span className="countdown-value">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="countdown-label">Hours</span>
                  </div>
                  <span className="countdown-separator">:</span>
                  <div className="countdown-item">
                    <span className="countdown-value">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="countdown-label">Min</span>
                  </div>
                  <span className="countdown-separator">:</span>
                  <div className="countdown-item">
                    <span className="countdown-value">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="countdown-label">Sec</span>
                  </div>
                </div>
              )}

              <div className="featured-stats">
                <span>
                  <Users size={14} /> {featured.participantCount || 0} participants
                </span>
                <span>
                  <Calendar size={14} />{" "}
                  {featured.tournamentStart
                    ? new Date(featured.tournamentStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
                <span>
                  <Zap size={14} /> {featured.currentStage?.replace("_", " ") || "Registration"}
                </span>
              </div>

              <Link to={`/tournaments/${featured._id}`} className="featured-action">
                View Tournament
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ============================================
          TOURNAMENT PATH
      ============================================ */}
      <section className="path-section">
        <div className="section-header">
          <div className="section-title">
            <Crown size={24} color="#FFD700" />
            <h2>The Road to the Crown</h2>
          </div>
          <p className="section-subtitle">Four stages of competition to determine the champion</p>
        </div>

        <div className="path-steps">
          {[
            {
              stage: 1,
              label: "Group Stage",
              icon: "🌍",
              color: "#4CAF50",
              desc: "Qualification rounds",
            },
            {
              stage: 2,
              label: "Quarter Final",
              icon: "⚡",
              color: "#FF9800",
              desc: "Top 8 battle",
            },
            { stage: 3, label: "Semi Final", icon: "🔥", color: "#9C27B0", desc: "Final four" },
            {
              stage: 4,
              label: "Grand Final",
              icon: "👑",
              color: "#FFD700",
              desc: "Champion crowned",
            },
          ].map((step) => (
            <div key={step.stage} className="path-step">
              <div className="step-icon" style={{ borderColor: step.color }}>
                <span>{step.icon}</span>
              </div>
              <div className="step-content">
                <div className="step-number">Stage {step.stage}</div>
                <div className="step-label">{step.label}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
              {step.stage < 4 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          TOURNAMENTS GRID
      ============================================ */}
      <section className="tournaments-section">
        <div className="section-header">
          <div>
            <h2>Active Tournaments</h2>
            <p className="section-subtitle">{active.length} tournaments currently running</p>
          </div>
          <Link to="/tournaments" className="btn-outline">
            View All
            <ChevronRight size={16} />
          </Link>
        </div>

        {active.length > 0 ? (
          <div className="tournaments-grid">
            {active.slice(0, 6).map((t) => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Trophy size={48} />
            <h3>No Active Tournaments</h3>
            <p>Check back soon for upcoming competitions</p>
          </div>
        )}
      </section>

      {/* ============================================
          REWARDS / PRIZE SECTION
      ============================================ */}
      <section className="rewards-section">
        <div className="rewards-grid">
          <div className="reward-card reward-card-gold">
            <div className="reward-icon">
              <Crown size={32} color="#FFD700" />
            </div>
            <div>
              <div className="reward-label">Grand Prize</div>
              <div className="reward-value">$10,000</div>
              <div className="reward-desc">+ Exclusive NFT Trophy</div>
            </div>
          </div>

          <div className="reward-card reward-card-blue">
            <div className="reward-icon">
              <Award size={32} color="#2979FF" />
            </div>
            <div>
              <div className="reward-label">Runner Up</div>
              <div className="reward-value">$5,000</div>
              <div className="reward-desc">+ Silver Medal</div>
            </div>
          </div>

          <div className="reward-card reward-card-purple">
            <div className="reward-icon">
              <Trophy size={32} color="#9C27B0" />
            </div>
            <div>
              <div className="reward-label">Third Place</div>
              <div className="reward-value">$2,500</div>
              <div className="reward-desc">+ Bronze Medal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
      ============================================ */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-text">
            <Badge tone="gold">Join the Arena</Badge>
            <h2>Ready to Compete?</h2>
            <p>
              Register now and secure your spot in the Code Arena Championship 2026. Battle against
              the best coders and claim your glory.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/register" className="btn-primary btn-large">
              Register Now
              <ArrowRight size={20} />
            </Link>
            <Link to="/tournaments" className="btn-secondary btn-large">
              Browse Tournaments
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        /* ============================================
           HERO SECTION
        ============================================ */
        .hero-section {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          padding: 60px 0 80px;
          min-height: 500px;
          align-items: center;
          overflow: hidden;
        }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .hero-glow-1 {
          top: -30%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.06), transparent 70%);
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .hero-glow-2 {
          bottom: -40%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(156, 39, 176, 0.05), transparent 70%);
          animation: pulseGlow 6s ease-in-out infinite reverse;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 215, 0, 0.15);
        }

        .hero-content h1 {
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 800;
          line-height: 1.05;
          margin: 0 0 8px;
          background: linear-gradient(135deg, #FFFFFF, #64B5F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-year {
          display: block;
          -webkit-text-fill-color: #FFD700;
          color: #FFD700;
          font-size: clamp(32px, 4vw, 56px);
        }

        .hero-subtitle {
          font-size: clamp(16px, 1.2vw, 20px);
          color: rgba(255, 255, 255, 0.7);
          max-width: 500px;
          line-height: 1.8;
          margin-bottom: 32px;
        }

        .hero-subtitle .highlight {
          color: #FFD700;
          font-weight: 600;
          display: inline-block;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .btn-large {
          padding: 14px 32px;
          font-size: 16px;
          border-radius: 12px;
          gap: 10px;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .stat-item strong {
          color: white;
          font-size: 20px;
          display: block;
        }
        .stat-item .stat-label {
          font-size: 12px;
          margin-left: 4px;
        }
        .stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.06);
        }

        /* ============================================
           FEATURED CARD
        ============================================ */
        .hero-featured {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: flex-end;
        }

        .featured-card {
          padding: 32px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          max-width: 420px;
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .featured-card:hover {
          transform: translateY(-4px);
          border-color: rgba(41, 121, 255, 0.2);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
        }

        .featured-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .featured-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot.live { background: #FF6B6B; animation: pulse 1.5s infinite; }
        .status-dot.registration { background: #4CAF50; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }

        .featured-card h3 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .featured-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .featured-countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 48px;
        }
        .countdown-value {
          font-size: 28px;
          font-weight: 700;
          color: #64B5F6;
          font-variant-numeric: tabular-nums;
        }
        .countdown-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .countdown-separator {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.2);
          padding: 0 4px;
        }

        .featured-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 20px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .featured-stats span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .featured-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          width: 100%;
          justify-content: center;
        }
        .featured-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.3);
        }

        /* ============================================
           PATH SECTION
        ============================================ */
        .path-section {
          padding: 60px 0;
        }

        .section-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 48px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-title h2 {
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #FFFFFF, #64B5F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 16px;
          margin-top: 4px;
        }

        .path-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          position: relative;
          max-width: 900px;
          margin: 0 auto;
        }

        .path-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          padding: 0 12px;
        }

        .step-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: rgba(255, 255, 255, 0.03);
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }
        .path-step:hover .step-icon {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);
        }

        .step-number {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .step-label {
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin: 2px 0 4px;
        }
        .step-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .step-connector {
          position: absolute;
          right: -50%;
          top: 32px;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        }

        /* ============================================
           TOURNAMENTS SECTION
        ============================================ */
        .tournaments-section {
          padding: 40px 0;
        }

        .tournaments-section .section-header {
          flex-direction: row;
          justify-content: space-between;
          text-align: left;
          margin-bottom: 32px;
        }
        .tournaments-section .section-header .section-subtitle {
          margin-top: 0;
        }

        .tournaments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        /* ============================================
           REWARDS SECTION
        ============================================ */
        .rewards-section {
          padding: 40px 0;
        }

        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .reward-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 28px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.3s ease;
        }
        .reward-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .reward-card-gold { border-color: rgba(255, 215, 0, 0.15); }
        .reward-card-gold:hover { background: rgba(255, 215, 0, 0.05); }
        .reward-card-blue { border-color: rgba(41, 121, 255, 0.15); }
        .reward-card-blue:hover { background: rgba(41, 121, 255, 0.05); }
        .reward-card-purple { border-color: rgba(156, 39, 176, 0.15); }
        .reward-card-purple:hover { background: rgba(156, 39, 176, 0.05); }

        .reward-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reward-card-gold .reward-icon { background: rgba(255, 215, 0, 0.1); }
        .reward-card-blue .reward-icon { background: rgba(41, 121, 255, 0.1); }
        .reward-card-purple .reward-icon { background: rgba(156, 39, 176, 0.1); }

        .reward-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .reward-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }
        .reward-card-gold .reward-value { color: #FFD700; }
        .reward-card-blue .reward-value { color: #64B5F6; }
        .reward-card-purple .reward-value { color: #CE93D8; }
        .reward-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ============================================
           CTA SECTION
        ============================================ */
        .cta-section {
          padding: 60px 0;
        }

        .cta-content {
          padding: 48px 60px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.08), rgba(156, 39, 176, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 32px;
        }

        .cta-text {
          flex: 1;
          min-width: 280px;
        }
        .cta-text h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 12px 0 8px;
        }
        .cta-text p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          line-height: 1.7;
          max-width: 500px;
        }

        .cta-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ============================================
           EMPTY STATE
        ============================================ */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.06);
        }
        .empty-state svg { opacity: 0.2; }
        .empty-state h3 { font-size: 20px; font-weight: 600; color: rgba(255, 255, 255, 0.5); }
        .empty-state p { color: rgba(255, 255, 255, 0.3); }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 1200px) {
          .hero-section { gap: 40px; }
        }

        @media (max-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 40px 0;
          }
          .hero-featured { justify-content: center; }
          .featured-card { max-width: 100%; }
          .path-steps { grid-template-columns: repeat(2, 1fr); gap: 32px; }
          .step-connector { display: none; }
          .rewards-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 40px; }
          .hero-year { font-size: 28px; }
          .hero-stats { flex-wrap: wrap; gap: 16px; }
          .stat-divider { display: none; }
          .cta-content { padding: 32px 24px; flex-direction: column; text-align: center; }
          .cta-actions { justify-content: center; }
          .tournaments-grid { grid-template-columns: 1fr; }
          .path-steps { grid-template-columns: 1fr; gap: 24px; }
        }

        @media (max-width: 480px) {
          .hero-actions { flex-direction: column; }
          .btn-large { width: 100%; justify-content: center; }
          .featured-countdown { gap: 2px; }
          .countdown-item { min-width: 36px; }
          .countdown-value { font-size: 20px; }
          .reward-card { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default Home;
