import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Users, Calendar, Clock, Sparkles, Crown, Plus } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { TournamentCard } from "../components/TournamentCard"; // ✅ Import directly
import { tournamentApi } from "../services/tournamentApi";
import { useAuth } from "../context/AuthContext";
import type { Tournament } from "../types";

const TOURNAMENT_STAGES = [
  { stage: 1, label: "Group Stage", icon: "🌍", color: "#4CAF50" },
  { stage: 2, label: "Quarter Final", icon: "⚡", color: "#FF9800" },
  { stage: 3, label: "Semi Final", icon: "🔥", color: "#F44336" },
  { stage: 4, label: "Grand Final", icon: "👑", color: "#9C27B0" },
  { stage: 5, label: "Champion", icon: "⭐", color: "#FFD700" },
];

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const { tournaments: allTournaments } = await tournamentApi.list();
        setTournaments(allTournaments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tournaments");
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  // Calculate countdown for the first upcoming tournament
  useEffect(() => {
    // ✅ Fix: Use 'REGISTRATION' instead of 'DRAFT' (DRAFT is not a valid TournamentStatus)
    const upcomingTournament = tournaments.find((t) => t.status === "REGISTRATION");
    const startDate = upcomingTournament?.tournamentStart;
    if (!startDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const difference = start - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [tournaments]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const activeTournaments = tournaments.filter((t) => t.status !== "COMPLETED");
  const completedTournaments = tournaments.filter((t) => t.status === "COMPLETED");
  const isCountdownZero =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <>
      <Navbar />
      <main
        style={{
          background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "0 20px 60px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Hero Section */}
          <section
            style={{
              position: "relative",
              padding: "60px 20px 40px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "60px",
              alignItems: "center",
              minHeight: "400px",
              overflow: "hidden",
            }}
          >
            {/* Animated Background Glows */}
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-30%",
                width: "800px",
                height: "800px",
                background: "radial-gradient(circle, rgba(41, 121, 255, 0.08) 0%, transparent 70%)",
                borderRadius: "50%",
                animation: "pulseGlow 4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-40%",
                left: "-20%",
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, rgba(156, 39, 176, 0.06) 0%, transparent 70%)",
                borderRadius: "50%",
                animation: "pulseGlow 6s ease-in-out infinite reverse",
              }}
            />

            {/* Left Column */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: "24px" }}>
                <Badge
                  tone="blue"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 16px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: "linear-gradient(135deg, #2979FF, #1565C0)",
                  }}
                >
                  <Sparkles size={14} />
                  Championship Series
                </Badge>
              </div>

              <h1
                style={{
                  fontSize: "clamp(40px, 6vw, 72px)",
                  fontWeight: "800",
                  lineHeight: "1.1",
                  marginBottom: "12px",
                  background: "linear-gradient(135deg, #FFFFFF 0%, #64B5F6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CODE ARENA
                <span
                  style={{
                    display: "block",
                    color: "#FFD700",
                    WebkitTextFillColor: "#FFD700",
                    fontSize: "clamp(28px, 4vw, 56px)",
                  }}
                >
                  2026
                </span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(16px, 1.2vw, 20px)",
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: "480px",
                  lineHeight: "1.8",
                  marginBottom: "32px",
                }}
              >
                Elite competitive programming championships where{" "}
                <strong style={{ color: "white" }}>coders</strong> battle for the ultimate crown.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                {activeTournaments.length > 0 && (
                  <Link to={`/tournaments/${activeTournaments[0]._id}`}>
                    <Button
                      style={{
                        padding: "14px 32px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #FFD700, #FFA000)",
                        color: "#0a0e1a",
                        fontWeight: "700",
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(255, 215, 0, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      View Active Tournament <ArrowRight size={18} />
                    </Button>
                  </Link>
                )}
                <Link to="/bracket">
                  <div
                    style={{
                      padding: "14px 32px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.08)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      fontWeight: "600",
                      fontSize: "16px",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Explore Bracket
                  </div>
                </Link>
                {isAuthenticated && user?.role === "ADMIN" && (
                  <Link to="/admin/tournaments/create">
                    <div
                      style={{
                        padding: "14px 32px",
                        borderRadius: "12px",
                        background: "rgba(41,121,255,0.15)",
                        color: "#2979FF",
                        border: "1px solid rgba(41,121,255,0.2)",
                        fontWeight: "600",
                        fontSize: "16px",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(41,121,255,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(41,121,255,0.15)";
                      }}
                    >
                      <Plus size={18} />
                      New Tournament
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column - Countdown Card */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(16px)",
                borderRadius: "24px",
                padding: "36px 32px 32px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.05)",
                    padding: "6px 16px",
                    borderRadius: "100px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  <Clock size={14} />
                  {isCountdownZero ? "Event Started" : "Next Round In"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Minutes" },
                  { value: timeLeft.seconds, label: "Seconds" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      textAlign: "center",
                      padding: "16px 8px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(28px, 3vw, 40px)",
                        fontWeight: "700",
                        color: isCountdownZero ? "#FF6B6B" : "#64B5F6",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginTop: "4px",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Calendar size={16} />
                  {activeTournaments.length > 0 && activeTournaments[0]?.tournamentStart
                    ? new Date(activeTournaments[0].tournamentStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </div>
                <Badge
                  tone={activeTournaments.length > 0 ? "blue" : "muted"}
                  style={{
                    fontSize: "11px",
                    padding: "4px 14px",
                    borderRadius: "100px",
                    fontWeight: "600",
                    background:
                      activeTournaments.length > 0
                        ? "linear-gradient(135deg, #2979FF, #1565C0)"
                        : "rgba(255,255,255,0.1)",
                  }}
                >
                  {activeTournaments.length > 0 ? "Active" : "No Active"}
                </Badge>
              </div>
            </div>

            <style>{`
              @keyframes pulseGlow {
                0%, 100% { transform: scale(1); opacity: 0.4; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
            `}</style>
          </section>

          {/* Tournament Path Section */}
          <section
            style={{
              padding: "60px 20px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "48px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "8px",
                }}
              >
                Tournament Path
              </span>
              <h2
                style={{
                  fontSize: "clamp(28px, 3vw, 40px)",
                  fontWeight: "700",
                  margin: 0,
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                The Road to the Crown
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "16px",
                position: "relative",
              }}
            >
              {TOURNAMENT_STAGES.map(({ stage, label, icon, color }) => (
                <div
                  key={stage}
                  style={{
                    position: "relative",
                    textAlign: "center",
                    padding: "24px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: `radial-gradient(circle at center, ${color}22, transparent)`,
                      border: `2px solid ${color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "700",
                      color: color,
                      transition: "transform 0.3s ease",
                    }}
                  >
                    {icon}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    Stage {stage}
                  </div>
                  <strong
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "white",
                      display: "block",
                    }}
                  >
                    {label}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {/* Tournaments Grid */}
          <section style={{ padding: "40px 20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "clamp(24px, 2.5vw, 32px)",
                    fontWeight: "700",
                    margin: 0,
                    background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Active Tournaments
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.5)",
                    margin: "4px 0 0",
                  }}
                >
                  {activeTournaments.length} tournaments running
                </p>
              </div>
              {isAuthenticated && user?.role === "ADMIN" && (
                <Link to="/admin/tournaments/create">
                  <Button
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2979FF, #1565C0)",
                      border: "none",
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    <Plus size={16} /> New Tournament
                  </Button>
                </Link>
              )}
            </div>

            {activeTournaments.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {activeTournaments.map((tournament) => (
                  <TournamentCard key={tournament._id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Trophy size={48} color="rgba(255,255,255,0.1)" />
                <h3 style={{ color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
                  No Active Tournaments
                </h3>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                  Check back later for upcoming competitions
                </p>
              </div>
            )}
          </section>

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section style={{ padding: "40px 20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontWeight: "700",
                      margin: 0,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    Completed Tournaments
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.3)",
                      margin: "4px 0 0",
                    }}
                  >
                    {completedTournaments.length} tournaments finished
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {completedTournaments.map((tournament) => (
                  <TournamentCard key={tournament._id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* Reward Cards */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              padding: "0 20px",
            }}
          >
            <Card
              style={{
                padding: "32px",
                background: "rgba(255,215,0,0.04)",
                border: "1px solid rgba(255,215,0,0.12)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{ display: "contents", width: "100%" }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(255,215,0,0.08)";
                    card.style.transform = "translateY(-4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(255,215,0,0.04)";
                    card.style.transform = "translateY(0)";
                  }
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "rgba(255,215,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={32} color="#FFD700" />
                </div>
                <div>
                  <small
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    Grand Prize
                  </small>
                  <strong
                    style={{
                      fontSize: "18px",
                      color: "white",
                      display: "block",
                    }}
                  >
                    Champion Crown
                  </strong>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    One competitor earns the glory
                  </span>
                </div>
              </div>
            </Card>

            <Card
              style={{
                padding: "32px",
                background: "rgba(41,121,255,0.04)",
                border: "1px solid rgba(41,121,255,0.12)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{ display: "contents", width: "100%" }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(41,121,255,0.08)";
                    card.style.transform = "translateY(-4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(41,121,255,0.04)";
                    card.style.transform = "translateY(0)";
                  }
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "rgba(41,121,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={32} color="#2979FF" />
                </div>
                <div>
                  <small
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    Competitors
                  </small>
                  <strong
                    style={{
                      fontSize: "18px",
                      color: "white",
                      display: "block",
                    }}
                  >
                    Elite Coders
                  </strong>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Battle for supremacy
                  </span>
                </div>
              </div>
            </Card>

            <Card
              style={{
                padding: "32px",
                background: "rgba(156,39,176,0.04)",
                border: "1px solid rgba(156,39,176,0.12)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{ display: "contents", width: "100%" }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(156,39,176,0.08)";
                    card.style.transform = "translateY(-4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget.closest("[data-card]") as HTMLElement;
                  if (card) {
                    card.style.background = "rgba(156,39,176,0.04)";
                    card.style.transform = "translateY(0)";
                  }
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "rgba(156,39,176,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Crown size={32} color="#9C27B0" />
                </div>
                <div>
                  <small
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    Prize Pool
                  </small>
                  <strong
                    style={{
                      fontSize: "18px",
                      color: "white",
                      display: "block",
                    }}
                  >
                    $10,000 USD
                  </strong>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    + Exclusive NFT Trophy
                  </span>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
};
