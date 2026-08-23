import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Crown,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { tournamentApi } from "../services/tournamentApi";
import type { Tournament } from "../types";

const TOURNAMENT_STAGES = [
  { stage: 1, label: "Group Stage", icon: "🌍", color: "#4CAF50" },
  { stage: 2, label: "Quarter Final", icon: "⚡", color: "#FF9800" },
  { stage: 3, label: "Semi Final", icon: "🔥", color: "#F44336" },
  { stage: 4, label: "Grand Final", icon: "👑", color: "#9C27B0" },
  { stage: 5, label: "Champion", icon: "⭐", color: "#FFD700" },
];

export const Home = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const { tournaments } = await tournamentApi.list();
        setTournament(tournaments[0] || null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load tournament",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, []);

  useEffect(() => {
    if (!tournament?.startDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(tournament.startDate).getTime();
      const difference = start - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [tournament]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const isCompleted = tournament?.status === "COMPLETED";
  const badgeTone = isCompleted ? "gold" : "blue";
  const statusLabel = tournament?.status || "REGISTRATION";

  return (
    <>
      <Navbar />
      <main
        className="home"
        style={{
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          paddingBottom: "60px",
        }}
      >
        {/* Hero Section */}
        <section
          className="hero-panel"
          style={{
            position: "relative",
            padding: "80px 40px",
            maxWidth: "1400px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
            minHeight: "500px",
            overflow: "hidden",
          }}
        >
          {/* Animated Background Elements */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-30%",
              width: "800px",
              height: "800px",
              background:
                "radial-gradient(circle, rgba(41, 121, 255, 0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "pulse 4s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-40%",
              left: "-20%",
              width: "600px",
              height: "600px",
              background:
                "radial-gradient(circle, rgba(156, 39, 176, 0.08) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "pulse 6s ease-in-out infinite reverse",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: "24px" }}>
              <Badge tone="blue">
                <Sparkles
                  size={14}
                  style={{ marginRight: "8px", display: "inline" }}
                />
                Championship Series
              </Badge>
            </div>

            <h1
              style={{
                fontSize: "clamp(48px, 6vw, 80px)",
                fontWeight: "800",
                lineHeight: "1.1",
                marginBottom: "16px",
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
                  fontSize: "clamp(32px, 4vw, 60px)",
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
              Elite competitive programming championship where{" "}
              <strong style={{ color: "white" }}>20</strong> top coders battle
              for the ultimate crown.
            </p>

            <div
              className="hero-actions"
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <Link to="/register">
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
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  Register Now <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/bracket">
                <Button
                  variant="secondary"
                  style={{
                    padding: "14px 32px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  Explore Bracket
                </Button>
              </Link>
            </div>
          </div>

          {/* Countdown Section */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "40px",
              border: "1px solid rgba(255,255,255,0.1)",
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
                  padding: "8px 16px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                <Clock size={14} />
                Next Round In
              </div>
            </div>

            <div
              className="timer"
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
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(28px, 3vw, 40px)",
                      fontWeight: "700",
                      color: item.value === 0 ? "#FF6B6B" : "#64B5F6",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.4)",
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
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <Calendar size={16} />
                {tournament?.startDate
                  ? new Date(tournament.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD"}
              </div>
              <Badge tone={badgeTone}>{statusLabel}</Badge>
            </div>
          </div>

          {/* CSS Animation Keyframes */}
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 1; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            .hero-actions button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 30px rgba(255, 215, 0, 0.3);
            }
            .hero-actions button:active {
              transform: translateY(0px);
            }
          `}</style>
        </section>

        {/* Tournament Path Section */}
        <section
          className="section"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "60px 40px",
          }}
        >
          <div
            className="section-title"
            style={{
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
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
            className="path"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              position: "relative",
            }}
          >
            {/* Connection lines - desktop */}
            <div className="path-connection" />

            {TOURNAMENT_STAGES.map(({ stage, label, icon, color }) => (
              <div
                className="path-step"
                key={stage}
                style={{
                  position: "relative",
                  textAlign: "center",
                  padding: "24px 16px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                {/* Stage number circle */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    margin: "0 auto 12px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle at center, ${color}33, transparent)`,
                    border: `2px solid ${color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
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
                    color: "rgba(255,255,255,0.3)",
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

                {/* Progress indicator */}
                {stage <= 3 && <div className="path-arrow" />}
              </div>
            ))}
          </div>

          <style>{`
            .path-connection {
              position: absolute;
              top: 50%;
              left: 10%;
              right: 10%;
              height: 2px;
              background: linear-gradient(90deg, rgba(255,215,0,0.2), rgba(41,121,255,0.2));
              display: none;
            }
            .path-arrow {
              position: absolute;
              right: -12px;
              top: 50%;
              transform: translateY(-50%);
              color: rgba(255,255,255,0.1);
              display: none;
            }
            @media (min-width: 768px) {
              .path-connection {
                display: block;
              }
              .path-arrow {
                display: block;
              }
            }
          `}</style>
        </section>

        {/* Reward & Stats Section */}
        <section
          className="reward-row"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          <Card
            style={{
              padding: "32px",
              background: "rgba(255,215,0,0.05)",
              border: "1px solid rgba(255,215,0,0.15)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s ease",
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
                  color: "rgba(255,255,255,0.4)",
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
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                One competitor earns the glory
              </span>
            </div>
          </Card>

          <Card
            style={{
              padding: "32px",
              background: "rgba(41,121,255,0.05)",
              border: "1px solid rgba(41,121,255,0.15)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s ease",
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
                  color: "rgba(255,255,255,0.4)",
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
                20 Elite Coders
              </strong>
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                One ultimate arena
              </span>
            </div>
          </Card>

          <Card
            style={{
              padding: "32px",
              background: "rgba(156,39,176,0.05)",
              border: "1px solid rgba(156,39,176,0.15)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transition: "all 0.3s ease",
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
                  color: "rgba(255,255,255,0.4)",
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
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                + Exclusive NFT Trophy
              </span>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
};
