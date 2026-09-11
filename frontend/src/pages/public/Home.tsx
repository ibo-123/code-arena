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
  Code2,
  Swords,
  Target,
  Flame,
  Star,
  Shield,
  Timer,
  BarChart3,
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
        {/* Animated Background */}
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
          <div className="floating-code code-1">{`{ }`}</div>
          <div className="floating-code code-2">{`< />`}</div>
          <div className="floating-code code-3">{`[ ]`}</div>
          <div className="floating-code code-4">{`=>`}</div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Championship Series 2026</span>
            <div className="badge-glow" />
          </div>

          <h1>
            <span className="hero-title-line">Code</span>
            <span className="hero-title-line hero-title-accent">Arena</span>
            <span className="hero-year">2026</span>
          </h1>

          <p className="hero-subtitle">
            Elite competitive programming tournament where coders battle for the ultimate crown.
            <span className="highlight"> $10,000 Prize Pool</span>
          </p>

          <div className="hero-actions">
            <Link to="/tournaments" className="btn-primary btn-large">
              <span>View Tournaments</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/bracket" className="btn-secondary btn-large">
              <Trophy size={20} />
              <span>View Bracket</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-info">
                <strong>{active.reduce((sum, t) => sum + (t.participantCount || 0), 0)}</strong>
                <span className="stat-label">Competitors</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-icon">
                <Trophy size={20} />
              </div>
              <div className="stat-info">
                <strong>{active.length}</strong>
                <span className="stat-label">Active Tournaments</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp size={20} />
              </div>
              <div className="stat-info">
                <strong>32</strong>
                <span className="stat-label">Contests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Tournament Card */}
        {featured && (
          <div className="hero-featured">
            <div className="featured-card">
              <div className="featured-glow" />
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
                  <Star size={12} />
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
                  <div className="countdown-label-top">
                    <Timer size={14} />
                    Starts in
                  </div>
                  <div className="countdown-items">
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
                <span>View Tournament</span>
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
            <div className="section-icon">
              <Crown size={24} />
            </div>
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
              gradient: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            },
            {
              stage: 2,
              label: "Quarter Final",
              icon: "⚡",
              color: "#FF9800",
              desc: "Top 8 battle",
              gradient: "linear-gradient(135deg, #FF9800, #F57C00)",
            },
            {
              stage: 3,
              label: "Semi Final",
              icon: "🔥",
              color: "#9C27B0",
              desc: "Final four",
              gradient: "linear-gradient(135deg, #9C27B0, #7B1FA2)",
            },
            {
              stage: 4,
              label: "Grand Final",
              icon: "👑",
              color: "#FFD700",
              desc: "Champion crowned",
              gradient: "linear-gradient(135deg, #FFD700, #FFA000)",
            },
          ].map((step) => (
            <div key={step.stage} className="path-step">
              <div
                className="step-icon"
                style={{
                  background: step.gradient,
                  boxShadow: `0 0 30px ${step.color}20`,
                }}
              >
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
          <div className="section-header-left">
            <div className="section-icon-sm">
              <Swords size={20} />
            </div>
            <div>
              <h2>Active Tournaments</h2>
              <p className="section-subtitle">{active.length} tournaments currently running</p>
            </div>
          </div>
          <Link to="/tournaments" className="btn-outline">
            <span>View All</span>
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
            <div className="empty-icon">
              <Trophy size={48} />
            </div>
            <h3>No Active Tournaments</h3>
            <p>Check back soon for upcoming competitions</p>
            <Link to="/tournaments" className="btn-primary">
              Browse All Tournaments
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* ============================================
          REWARDS / PRIZE SECTION
      ============================================ */}
      <section className="rewards-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <Award size={24} />
            </div>
            <h2>Prize Pool</h2>
          </div>
          <p className="section-subtitle">$17,500 total prize pool across all placements</p>
        </div>

        <div className="rewards-grid">
          <div className="reward-card reward-card-gold">
            <div className="reward-glow" />
            <div className="reward-rank">
              <Crown size={16} />
              1st
            </div>
            <div className="reward-icon">
              <Crown size={36} color="#FFD700" />
            </div>
            <div className="reward-content">
              <div className="reward-label">Grand Prize</div>
              <div className="reward-value">$10,000</div>
              <div className="reward-desc">+ Exclusive NFT Trophy</div>
            </div>
            <div
              className="reward-bar"
              style={{ width: "100%", background: "linear-gradient(90deg, #FFD700, #FFA000)" }}
            />
          </div>

          <div className="reward-card reward-card-blue">
            <div className="reward-glow" />
            <div className="reward-rank">
              <Shield size={16} />
              2nd
            </div>
            <div className="reward-icon">
              <Award size={36} color="#2979FF" />
            </div>
            <div className="reward-content">
              <div className="reward-label">Runner Up</div>
              <div className="reward-value">$5,000</div>
              <div className="reward-desc">+ Silver Medal</div>
            </div>
            <div
              className="reward-bar"
              style={{ width: "60%", background: "linear-gradient(90deg, #2979FF, #1565C0)" }}
            />
          </div>

          <div className="reward-card reward-card-purple">
            <div className="reward-glow" />
            <div className="reward-rank">
              <Target size={16} />
              3rd
            </div>
            <div className="reward-icon">
              <Trophy size={36} color="#9C27B0" />
            </div>
            <div className="reward-content">
              <div className="reward-label">Third Place</div>
              <div className="reward-value">$2,500</div>
              <div className="reward-desc">+ Bronze Medal</div>
            </div>
            <div
              className="reward-bar"
              style={{ width: "35%", background: "linear-gradient(90deg, #9C27B0, #7B1FA2)" }}
            />
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
      ============================================ */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-bg">
            <div className="cta-glow-1" />
            <div className="cta-glow-2" />
          </div>
          <div className="cta-text">
            <div className="cta-badge">
              <Flame size={16} />
              Join the Arena
            </div>
            <h2>Ready to Compete?</h2>
            <p>
              Register now and secure your spot in the Code Arena Championship 2026. Battle against
              the best coders and claim your glory.
            </p>
            <div className="cta-features">
              <span>
                <Code2 size={14} /> Real-time judging
              </span>
              <span>
                <BarChart3 size={14} /> Live leaderboard
              </span>
              <span>
                <Zap size={14} /> Instant feedback
              </span>
            </div>
          </div>
          <div className="cta-actions">
            <Link to="/register" className="btn-primary btn-large">
              <span>Register Now</span>
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
          padding: 80px 0 100px;
          min-height: 600px;
          align-items: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
        }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }
        .hero-glow-1 {
          top: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: rgba(41, 121, 255, 0.08);
          animation: pulseGlow 5s ease-in-out infinite;
        }
        .hero-glow-2 {
          bottom: -30%;
          left: -15%;
          width: 500px;
          height: 500px;
          background: rgba(156, 39, 176, 0.06);
          animation: pulseGlow 7s ease-in-out infinite reverse;
        }
        .hero-glow-3 {
          top: 30%;
          left: 30%;
          width: 300px;
          height: 300px;
          background: rgba(255, 215, 0, 0.04);
          animation: pulseGlow 6s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        .floating-code {
          position: absolute;
          font-family: "Fira Code", "JetBrains Mono", monospace;
          font-size: 14px;
          color: rgba(100, 181, 246, 0.15);
          animation: float 6s ease-in-out infinite;
          user-select: none;
        }
        .code-1 { top: 15%; left: 10%; animation-delay: 0s; }
        .code-2 { top: 25%; right: 15%; animation-delay: 1s; }
        .code-3 { bottom: 30%; left: 20%; animation-delay: 2s; }
        .code-4 { bottom: 20%; right: 25%; animation-delay: 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.8; }
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 100px;
          background: rgba(255, 215, 0, 0.08);
          color: #FFD700;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 28px;
          border: 1px solid rgba(255, 215, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        .badge-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .hero-content h1 {
          font-size: clamp(56px, 7vw, 96px);
          font-weight: 800;
          line-height: 1;
          margin: 0 0 12px;
          letter-spacing: -0.03em;
        }

        .hero-title-line {
          display: block;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, #64B5F6, #2979FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-year {
          display: block;
          -webkit-text-fill-color: #FFD700;
          color: #FFD700;
          font-size: clamp(36px, 5vw, 64px);
          margin-top: 4px;
          text-shadow: 0 0 60px rgba(255, 215, 0, 0.3);
        }

        .hero-subtitle {
          font-size: clamp(16px, 1.2vw, 20px);
          color: rgba(255, 255, 255, 0.65);
          max-width: 520px;
          line-height: 1.8;
          margin-bottom: 36px;
        }

        .hero-subtitle .highlight {
          color: #FFD700;
          font-weight: 700;
          display: inline-block;
          position: relative;
        }

        .hero-subtitle .highlight::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #FFD700, transparent);
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        .btn-large {
          padding: 16px 36px;
          font-size: 16px;
          border-radius: 14px;
          gap: 10px;
          font-weight: 600;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.4);
        }

        .btn-primary:hover::before {
          opacity: 1;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 36px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
        }

        .stat-info strong {
          color: white;
          font-size: 22px;
          font-weight: 700;
          display: block;
          line-height: 1.2;
        }
        .stat-info .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .stat-divider {
          width: 1px;
          height: 40px;
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
          padding: 36px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          max-width: 440px;
          width: 100%;
          transition: all 0.4s ease;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }

        .featured-glow {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.06), transparent 60%);
          pointer-events: none;
        }

        .featured-card:hover {
          transform: translateY(-6px);
          border-color: rgba(41, 121, 255, 0.25);
          box-shadow: 0 32px 100px rgba(0, 0, 0, 0.5);
        }

        .featured-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }

        .featured-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot.live { 
          background: #FF6B6B; 
          box-shadow: 0 0 12px rgba(255, 107, 107, 0.6);
          animation: pulse 1.5s infinite; 
        }
        .status-dot.registration { 
          background: #4CAF50;
          box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .featured-card h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px;
          position: relative;
          z-index: 1;
          line-height: 1.3;
        }

        .featured-description {
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .featured-countdown {
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .countdown-label-top {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 12px;
          justify-content: center;
        }

        .countdown-items {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 56px;
        }
        .countdown-value {
          font-size: 32px;
          font-weight: 800;
          color: #64B5F6;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          text-shadow: 0 0 30px rgba(100, 181, 246, 0.4);
        }
        .countdown-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 6px;
          font-weight: 600;
        }
        .countdown-separator {
          font-size: 28px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.15);
          padding: 0 4px;
          margin-bottom: 16px;
        }

        .featured-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 20px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 1;
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
          padding: 14px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          width: 100%;
          justify-content: center;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .featured-action::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .featured-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.4);
        }

        .featured-action:hover::before {
          opacity: 1;
        }

        /* ============================================
           PATH SECTION
        ============================================ */
        .path-section {
          padding: 80px 0;
        }

        .section-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 56px;
        }

        .section-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .section-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 215, 0, 0.08);
          border: 1px solid rgba(255, 215, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
        }

        .section-icon-sm {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
        }

        .section-title h2 {
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          color: rgba(255, 255, 255, 0.45);
          font-size: 16px;
          margin-top: 6px;
        }

        .path-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          position: relative;
          max-width: 960px;
          margin: 0 auto;
        }

        .path-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          padding: 0 16px;
        }

        .step-icon {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 16px;
          transition: all 0.4s ease;
          position: relative;
        }

        .step-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .path-step:hover .step-icon {
          transform: translateY(-4px) scale(1.05);
        }

        .step-number {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .step-label {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin: 4px 0 4px;
        }
        .step-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .step-connector {
          position: absolute;
          right: -50%;
          top: 36px;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
        }

        /* ============================================
           TOURNAMENTS SECTION
        ============================================ */
        .tournaments-section {
          padding: 60px 0;
        }

        .tournaments-section .section-header {
          flex-direction: row;
          justify-content: space-between;
          text-align: left;
          margin-bottom: 40px;
        }
        .tournaments-section .section-header .section-subtitle {
          margin-top: 2px;
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateX(4px);
        }

        .tournaments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        /* ============================================
           REWARDS SECTION
        ============================================ */
        .rewards-section {
          padding: 60px 0;
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
          padding: 28px 32px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .reward-glow {
          position: absolute;
          top: -50%;
          right: -30%;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .reward-card:hover .reward-glow {
          opacity: 1;
        }

        .reward-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .reward-rank {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .reward-card-gold { border-color: rgba(255, 215, 0, 0.15); }
        .reward-card-gold:hover { background: rgba(255, 215, 0, 0.04); box-shadow: 0 20px 60px rgba(255, 215, 0, 0.08); }
        .reward-card-gold .reward-glow { background: rgba(255, 215, 0, 0.1); }
        .reward-card-gold .reward-rank { color: #FFD700; background: rgba(255, 215, 0, 0.1); }

        .reward-card-blue { border-color: rgba(41, 121, 255, 0.15); }
        .reward-card-blue:hover { background: rgba(41, 121, 255, 0.04); box-shadow: 0 20px 60px rgba(41, 121, 255, 0.08); }
        .reward-card-blue .reward-glow { background: rgba(41, 121, 255, 0.1); }
        .reward-card-blue .reward-rank { color: #64B5F6; background: rgba(41, 121, 255, 0.1); }

        .reward-card-purple { border-color: rgba(156, 39, 176, 0.15); }
        .reward-card-purple:hover { background: rgba(156, 39, 176, 0.04); box-shadow: 0 20px 60px rgba(156, 39, 176, 0.08); }
        .reward-card-purple .reward-glow { background: rgba(156, 39, 176, 0.1); }
        .reward-card-purple .reward-rank { color: #CE93D8; background: rgba(156, 39, 176, 0.1); }

        .reward-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reward-card-gold .reward-icon { background: rgba(255, 215, 0, 0.08); }
        .reward-card-blue .reward-icon { background: rgba(41, 121, 255, 0.08); }
        .reward-card-purple .reward-icon { background: rgba(156, 39, 176, 0.08); }

        .reward-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .reward-value {
          font-size: 28px;
          font-weight: 800;
          color: white;
          line-height: 1.2;
        }
        .reward-card-gold .reward-value { color: #FFD700; }
        .reward-card-blue .reward-value { color: #64B5F6; }
        .reward-card-purple .reward-value { color: #CE93D8; }
        .reward-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 2px;
        }

        .reward-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 0 0 0 20px;
        }

        /* ============================================
           CTA SECTION
        ============================================ */
        .cta-section {
          padding: 80px 0;
        }

        .cta-content {
          padding: 56px 64px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 40px;
          position: relative;
          overflow: hidden;
        }

        .cta-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .cta-glow-1 {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(41, 121, 255, 0.06);
          filter: blur(80px);
        }

        .cta-glow-2 {
          position: absolute;
          bottom: -50%;
          left: -10%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(156, 39, 176, 0.05);
          filter: blur(80px);
        }

        .cta-text {
          flex: 1;
          min-width: 300px;
          position: relative;
          z-index: 1;
        }

        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(255, 107, 107, 0.1);
          color: #FF6B6B;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 107, 107, 0.15);
        }

        .cta-text h2 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 12px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cta-text p {
          color: rgba(255, 255, 255, 0.55);
          font-size: 16px;
          line-height: 1.8;
          max-width: 520px;
          margin-bottom: 20px;
        }

        .cta-features {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cta-features span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
        }

        .cta-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        /* ============================================
           EMPTY STATE
        ============================================ */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 16px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 20px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .empty-state svg { opacity: 0.3; }
        .empty-state h3 { font-size: 22px; font-weight: 700; color: rgba(255, 255, 255, 0.6); margin: 0; }
        .empty-state p { color: rgba(255, 255, 255, 0.35); margin: 0 0 12px; }
        .empty-state .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
        }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 1200px) {
          .hero-section { gap: 40px; }
          .rewards-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr;
            gap: 48px;
            padding: 60px 0;
            min-height: auto;
          }
          .hero-featured { justify-content: center; }
          .featured-card { max-width: 100%; }
          .path-steps { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .step-connector { display: none; }
          .rewards-grid { grid-template-columns: 1fr; }
          .cta-content { padding: 40px 32px; }
        }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 48px; }
          .hero-year { font-size: 32px; }
          .hero-stats { flex-wrap: wrap; gap: 20px; }
          .stat-divider { display: none; }
          .cta-content { padding: 32px 24px; flex-direction: column; text-align: center; }
          .cta-actions { justify-content: center; width: 100%; }
          .cta-features { justify-content: center; }
          .tournaments-grid { grid-template-columns: 1fr; }
          .path-steps { grid-template-columns: 1fr; gap: 32px; }
          .tournaments-section .section-header { flex-direction: column; gap: 16px; text-align: center; align-items: center; }
          .section-header-left { flex-direction: column; text-align: center; }
          .countdown-value { font-size: 24px; }
          .countdown-item { min-width: 44px; }
          .reward-card { flex-direction: column; text-align: center; padding: 24px; }
          .reward-rank { top: 12px; right: 12px; }
        }

        @media (max-width: 480px) {
          .hero-content h1 { font-size: 36px; }
          .hero-year { font-size: 24px; }
          .hero-actions { flex-direction: column; }
          .btn-large { width: 100%; justify-content: center; }
          .featured-countdown { padding: 14px; }
          .countdown-item { min-width: 36px; }
          .countdown-value { font-size: 20px; }
          .countdown-separator { font-size: 20px; }
          .cta-actions { flex-direction: column; }
          .cta-actions .btn-large { width: 100%; justify-content: center; }
          .hero-badge { font-size: 11px; padding: 6px 14px; }
        }
      `}</style>
    </div>
  );
};

export default Home;
