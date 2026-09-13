// frontend/src/pages/public/Home.tsx
import { useEffect, useMemo, useState } from "react";
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
  GitBranch,
  Video,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState, ErrorState } from "../../components/common";
import { Badge } from "../../components/ui/Badge";
import type { Tournament } from "../../types";
import "./Home.css";

// ---- Static data -----------------------------------------------------

const PATH_STEPS = [
  {
    stage: 1,
    label: "Group Stage",
    emoji: "🌍",
    color: "#4CAF50",
    desc: "Regional qualifiers",
    gradient: "linear-gradient(135deg, #4CAF50, #2E7D32)",
  },
  {
    stage: 2,
    label: "Quarter Final",
    emoji: "⚡",
    color: "#FF9800",
    desc: "Top 8 battle",
    gradient: "linear-gradient(135deg, #FF9800, #F57C00)",
  },
  {
    stage: 3,
    label: "Semi Final",
    emoji: "🔥",
    color: "#9C27B0",
    desc: "Final four clash",
    gradient: "linear-gradient(135deg, #9C27B0, #7B1FA2)",
  },
  {
    stage: 4,
    label: "Grand Final",
    emoji: "👑",
    color: "#FFD700",
    desc: "Champion crowned",
    gradient: "linear-gradient(135deg, #FFD700, #FFA000)",
  },
] as const;

const PRIZES = [
  {
    rank: "1st",
    icon: <Crown size={36} color="#FFD700" />,
    rankIcon: <Crown size={16} />,
    tone: "gold",
    label: "Grand Prize",
    value: "$10,000",
    desc: "+ Exclusive trophy",
    barWidth: "100%",
  },
  {
    rank: "2nd",
    icon: <Award size={36} color="#2979FF" />,
    rankIcon: <Shield size={16} />,
    tone: "blue",
    label: "Runner Up",
    value: "$5,000",
    desc: "+ Silver medal",
    barWidth: "60%",
  },
  {
    rank: "3rd",
    icon: <Trophy size={36} color="#9C27B0" />,
    rankIcon: <Target size={16} />,
    tone: "purple",
    label: "Third Place",
    value: "$2,500",
    desc: "+ Bronze medal",
    barWidth: "35%",
  },
] as const;

const FEATURES = [
  {
    icon: <Code2 size={20} />,
    title: "Manual Invitations",
    desc: "Admins link Codeforces contests directly — no API keys or OAuth required.",
    color: "#2979FF",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Auto Bracket",
    desc: "Group stage results feed into quarter finals, semis, and the grand final.",
    color: "#9C27B0",
  },
  {
    icon: <Video size={20} />,
    title: "Video Verification",
    desc: "Participants confirm their Codeforces join, then submit proof for review.",
    color: "#4CAF50",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Live Standings",
    desc: "Ranks update instantly as admins enter solved counts and penalty minutes.",
    color: "#FF9800",
  },
] as const;

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const getTimeLeft = (target: string): TimeLeft => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return ZERO_TIME;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
};

const isZeroTime = (t: TimeLeft) =>
  t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0;

// ---- Component -------------------------------------------------------

export const Home = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(ZERO_TIME);

  // ---- Fetch --------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        if (!cancelled) setTournaments(tournaments);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Derived ------------------------------------------------------
  const active = useMemo(
    () =>
      tournaments.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
      ),
    [tournaments]
  );

  const featured = useMemo(() => {
    return (
      active.find(
        (t) => t.status === "REGISTRATION" || t.status === "GROUP_STAGE"
      ) ??
      active[0] ??
      null
    );
  }, [active]);

  const totalCompetitors = useMemo(
    () => active.reduce((sum, t) => sum + (t.participantCount || 0), 0),
    [active]
  );

  const totalContests = useMemo(
    () => active.reduce((sum, t) => sum + (t.contestCount || 0), 0),
    [active]
  );

  // ---- Countdown ----------------------------------------------------
  const countdownTarget = featured?.tournamentStart ?? null;

  useEffect(() => {
    if (!countdownTarget) {
      setTimeLeft(ZERO_TIME);
      return;
    }
    setTimeLeft(getTimeLeft(countdownTarget));
    const id = window.setInterval(() => {
      setTimeLeft(getTimeLeft(countdownTarget));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdownTarget]);

  // ---- Render -------------------------------------------------------
  if (loading) return <LoadingState variant="spinner" size="lg" />;
  if (error) return <ErrorState error={error} />;

  const showCountdown =
    featured?.tournamentStart &&
    !isZeroTime(timeLeft) &&
    (featured.status === "REGISTRATION" || featured.status === "GROUP_STAGE");

  return (
    <div className="public-home">
      {/* ============================================
          HERO
      ============================================ */}
      <section className="hero-section">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
          <div className="floating-code code-1">{"{ }"}</div>
          <div className="floating-code code-2">{"< />"}</div>
          <div className="floating-code code-3">{"[ ]"}</div>
          <div className="floating-code code-4">{"=>"}</div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Championship Series 2026</span>
            <div className="badge-glow" aria-hidden="true" />
          </div>

          <h1>
            <span className="hero-title-line">Code</span>
            <span className="hero-title-line hero-title-accent">Arena</span>
            <span className="hero-year">2026</span>
          </h1>

          <p className="hero-subtitle">
            Elite competitive programming tournament where coders battle for the
            ultimate crown.
            <span className="highlight"> $10,000 Prize Pool</span>
          </p>

          <div className="hero-actions">
            <Link to="/tournaments" className="btn-primary btn-large">
              <span>View Tournaments</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/tournaments" className="btn-secondary btn-large">
              <Trophy size={20} />
              <span>Browse Brackets</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-info">
                <strong>{totalCompetitors}</strong>
                <span className="stat-label">Competitors</span>
              </div>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <div className="stat-icon">
                <Trophy size={20} />
              </div>
              <div className="stat-info">
                <strong>{active.length}</strong>
                <span className="stat-label">Active Tournaments</span>
              </div>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp size={20} />
              </div>
              <div className="stat-info">
                <strong>{totalContests || "—"}</strong>
                <span className="stat-label">Live Contests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured tournament */}
        {featured && (
          <div className="hero-featured">
            <div className="featured-card">
              <div className="featured-glow" aria-hidden="true" />

              <div className="featured-header">
                <div className="featured-status">
                  <span
                    className={`status-dot ${
                      featured.status === "REGISTRATION"
                        ? "registration"
                        : "live"
                    }`}
                  />
                  {featured.status === "REGISTRATION"
                    ? "Registration Open"
                    : featured.status === "GROUP_STAGE"
                      ? "Group Stage"
                      : "Live"}
                </div>
                <Badge tone="gold" size="sm" icon={<Star size={12} />}>
                  Featured
                </Badge>
              </div>

              <h3>{featured.name}</h3>
              <p className="featured-description">
                {featured.description || "Join the ultimate coding competition"}
              </p>

              {showCountdown && (
                <div className="featured-countdown">
                  <div className="countdown-label-top">
                    <Timer size={14} />
                    Starts in
                  </div>
                  <div className="countdown-items">
                    <CountdownUnit value={timeLeft.days} label="Days" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.hours} label="Hours" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.minutes} label="Min" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.seconds} label="Sec" />
                  </div>
                </div>
              )}

              <div className="featured-stats">
                <span>
                  <Users size={14} /> {featured.participantCount || 0}{" "}
                  participants
                </span>
                <span>
                  <Calendar size={14} />{" "}
                  {featured.tournamentStart
                    ? new Date(featured.tournamentStart).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )
                    : "TBD"}
                </span>
                <span>
                  <Zap size={14} />{" "}
                  {featured.currentStage?.replace(/_/g, " ") || "Registration"}
                </span>
              </div>

              <Link
                to={`/tournaments/${featured._id}`}
                className="featured-action"
              >
                <span>View Tournament</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ============================================
          FEATURES — What makes Code Arena different
      ============================================ */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon section-icon--blue">
              <Sparkles size={24} />
            </div>
            <h2>Built for Competitive Coding</h2>
          </div>
          <p className="section-subtitle">
            Everything you need to run a tournament end-to-end
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ "--feature-color": f.color } as React.CSSProperties}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          ROAD TO THE CROWN
      ============================================ */}
      <section className="path-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <Crown size={24} />
            </div>
            <h2>The Road to the Crown</h2>
          </div>
          <p className="section-subtitle">
            Four stages of competition to determine the champion
          </p>
        </div>

        <div className="path-steps">
          {PATH_STEPS.map((step) => (
            <div key={step.stage} className="path-step">
              <div
                className="step-icon"
                style={{
                  background: step.gradient,
                  boxShadow: `0 0 30px ${step.color}20`,
                }}
              >
                <span>{step.emoji}</span>
              </div>
              <div className="step-content">
                <div className="step-number">Stage {step.stage}</div>
                <div className="step-label">{step.label}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
              {step.stage < PATH_STEPS.length && (
                <div className="step-connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          ACTIVE TOURNAMENTS
      ============================================ */}
      <section className="tournaments-section">
        <div className="section-header">
          <div className="section-header-left">
            <div className="section-icon-sm">
              <Swords size={20} />
            </div>
            <div>
              <h2>Active Tournaments</h2>
              <p className="section-subtitle">
                {active.length} tournament{active.length !== 1 ? "s" : ""}{" "}
                currently running
              </p>
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
            <div className="empty-icon" aria-hidden="true">
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
          PRIZE POOL
      ============================================ */}
      <section className="rewards-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <Award size={24} />
            </div>
            <h2>Prize Pool</h2>
          </div>
          <p className="section-subtitle">
            $17,500 total prize pool across all placements
          </p>
        </div>

        <div className="rewards-grid">
          {PRIZES.map((prize) => (
            <div
              key={prize.rank}
              className={`reward-card reward-card-${prize.tone}`}
            >
              <div className="reward-glow" aria-hidden="true" />
              <div className="reward-rank">
                {prize.rankIcon}
                {prize.rank}
              </div>
              <div className="reward-icon">{prize.icon}</div>
              <div className="reward-content">
                <div className="reward-label">{prize.label}</div>
                <div className="reward-value">{prize.value}</div>
                <div className="reward-desc">{prize.desc}</div>
              </div>
              <div
                className="reward-bar"
                style={{
                  width: prize.barWidth,
                  background:
                    prize.tone === "gold"
                      ? "linear-gradient(90deg, #FFD700, #FFA000)"
                      : prize.tone === "blue"
                        ? "linear-gradient(90deg, #2979FF, #1565C0)"
                        : "linear-gradient(90deg, #9C27B0, #7B1FA2)",
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          CTA
      ============================================ */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-bg" aria-hidden="true">
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
              Register now and secure your spot in the Code Arena Championship
              2026. Battle against the best coders and claim your glory.
            </p>
            <div className="cta-features">
              <span>
                <Code2 size={14} /> Manual invitations
              </span>
              <span>
                <BarChart3 size={14} /> Live leaderboard
              </span>
              <span>
                <Zap size={14} /> Instant advancement
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
    </div>
  );
};

// ---- Small helpers --------------------------------------------------

interface CountdownUnitProps {
  value: number;
  label: string;
}

const CountdownUnit = ({ value, label }: CountdownUnitProps) => (
  <div className="countdown-item">
    <span className="countdown-value">{String(value).padStart(2, "0")}</span>
    <span className="countdown-label">{label}</span>
  </div>
);

export default Home;