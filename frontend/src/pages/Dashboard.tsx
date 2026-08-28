import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Clock, 
  Users,
  Code2,
  Target,
  BarChart3,
  Medal,
  Star,
  Flame
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { Tournament, Participant } from '../types'

// ... rest of the component

// Fix Badge usage - remove style prop or pass it correctly

export const Dashboard = () => {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { tournaments } = await tournamentApi.list();
        const t = tournaments[0] || null;
        setTournament(t);

        if (t) {
          const result = await tournamentApi.participants(t._id);
          setTotalParticipants(result.participants.length);

          const p = result.participants.find(
            (item) => item.user._id === user?._id || item.user.id === user?.id,
          );
          setParticipant(p || null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const isCompleted = tournament?.status === "COMPLETED";
  const isRegistration = tournament?.status === "REGISTRATION";
  const badgeTone = isCompleted ? "gold" : isRegistration ? "blue" : "purple";
  const statusLabel = tournament?.currentRound || "Registration";

  // Calculate performance metrics
  const rank = participant?.rank || 0;
  const totalScore = participant?.score || 0;
  const solved = participant?.solved || 0;
  const penalty = participant?.penalty || 0;
  const isTopRank = rank > 0 && rank <= 3;
  const rankPercentile =
    totalParticipants > 0 && rank > 0
      ? Math.round(((totalParticipants - rank) / totalParticipants) * 100)
      : 0;

  return (
    <>
      <Navbar />
      <main
        style={{
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "0 40px 60px",
        }}
      >
        {/* Header */}
        <header
          className="page-heading"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Badge
            tone="purple"
            style={{
              padding: "6px 16px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, #9C27B0, #6A1B9A)",
              fontWeight: "600",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {statusLabel}
          </Badge>
          // Fix EmptyState usage
          <EmptyState
            label="No contest results yet."
            description="Your performance data will appear here once you participate in matches."
            icon={<Code2 size={32} />}
          />
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2979FF, #9C27B0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <small
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  Participant Dashboard
                </small>
                <h1
                  style={{
                    fontSize: "clamp(24px, 2.5vw, 36px)",
                    fontWeight: "700",
                    margin: 0,
                  }}
                >
                  Welcome back, {user?.username}
                </h1>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#00E676",
                  background: "rgba(0, 230, 118, 0.1)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  border: "1px solid rgba(0, 230, 118, 0.2)",
                }}
              >
                <CheckCircle2 size={14} />
                Codeforces Synced
              </div>

              {totalParticipants > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <Users size={14} />
                  {totalParticipants} participants
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Badge
              tone={badgeTone}
              style={{
                padding: "6px 16px",
                borderRadius: "100px",
                background: isCompleted
                  ? "linear-gradient(135deg, #FFD700, #FFA000)"
                  : isRegistration
                    ? "linear-gradient(135deg, #2979FF, #1565C0)"
                    : "linear-gradient(135deg, #9C27B0, #6A1B9A)",
                fontWeight: "600",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {statusLabel}
            </Badge>

            {isTopRank && (
              <Badge
                tone="gold"
                style={{
                  padding: "6px 16px",
                  borderRadius: "100px",
                  background: "linear-gradient(135deg, #FFD700, #FFA000)",
                  fontWeight: "700",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Star size={14} />
                Top {rank}
              </Badge>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div
          className="stat-grid"
          style={{
            maxWidth: "1400px",
            margin: "32px auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Current Rank",
              value: rank > 0 ? `#${rank}` : "—",
              icon: Medal,
              color: isTopRank ? "#FFD700" : "#64B5F6",
              bgColor: isTopRank
                ? "rgba(255,215,0,0.1)"
                : "rgba(100,181,246,0.1)",
            },
            {
              label: "Score",
              value: `${totalScore} pts`,
              icon: Award,
              color: "#4CAF50",
              bgColor: "rgba(76,175,80,0.1)",
            },
            {
              label: "Problems Solved",
              value: solved,
              icon: Code2,
              color: "#FF9800",
              bgColor: "rgba(255,152,0,0.1)",
            },
            {
              label: "Penalty",
              value: penalty,
              icon: Clock,
              color: "#F44336",
              bgColor: "rgba(244,67,54,0.1)",
            },
            {
              label: "Percentile",
              value: rank > 0 ? `${rankPercentile}%` : "—",
              icon: BarChart3,
              color: "#9C27B0",
              bgColor: "rgba(156,39,176,0.1)",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              style={{
                padding: "20px 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <small
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {stat.label}
                </small>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: stat.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={16} color={stat.color} />
                </div>
              </div>
              <strong
                style={{
                  fontSize: "clamp(24px, 2vw, 32px)",
                  fontWeight: "700",
                  color: stat.color,
                  display: "block",
                }}
              >
                {stat.value}
              </strong>
            </Card>
          ))}
        </div>

        {/* Two Column Layout */}
        <div
          className="two-col"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Next Match Card */}
          <Card
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-30%",
                width: "300px",
                height: "300px",
                background:
                  "radial-gradient(circle, rgba(41,121,255,0.05) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Target size={18} color="#2979FF" />
                <small
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Next Match Status
                </small>
              </div>

              <h2
                style={{
                  fontSize: "clamp(20px, 1.8vw, 28px)",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  background: isRegistration
                    ? "linear-gradient(135deg, #4CAF50, #8BC34A)"
                    : "linear-gradient(135deg, #2979FF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {isRegistration
                  ? "Registration is Open"
                  : tournament?.currentRound || "Upcoming Match"}
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                }}
              >
                {isRegistration
                  ? "Secure your spot in the arena. Registration closes soon!"
                  : "Check the live contest and bracket for the official match state."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Link to={isRegistration ? "/register" : "/live"}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      background: isRegistration
                        ? "linear-gradient(135deg, #4CAF50, #388E3C)"
                        : "linear-gradient(135deg, #2979FF, #1565C0)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isRegistration ? "Register Now" : "Open Live Contest"}
                    <ArrowRight size={16} />
                  </div>
                </Link>

                {!isRegistration && (
                  <Link to="/bracket">
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: "500",
                        fontSize: "14px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                    >
                      View Bracket
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Results Card */}
          <Card
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <Flame size={18} color="#FF6B6B" />
              <small
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Recent Contest Logs
              </small>
            </div>

            {participant ? (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Rank
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: isTopRank ? "#FFD700" : "white",
                      }}
                    >
                      #{rank || "—"}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Solved
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#4CAF50",
                      }}
                    >
                      {solved}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Total Score
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                      }}
                    >
                      {totalScore} pts
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Penalty
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#F44336",
                      }}
                    >
                      {penalty}
                    </div>
                  </div>
                </div>

                {isTopRank && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,215,0,0.05)",
                      border: "1px solid rgba(255,215,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Medal size={16} color="#FFD700" />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#FFD700",
                        fontWeight: "600",
                      }}
                    >
                      Outstanding performance! Top {rank} rank
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                label="No contest results yet."
                description="Your performance data will appear here once you participate in matches."
                icon={<Code2 size={32} />}
              />
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "24px auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            { label: "View Bracket", to: "/bracket", icon: "🏆" },
            { label: "Live Contest", to: "/live", icon: "⚡" },
            { label: "Leaderboard", to: "/leaderboard", icon: "📊" },
            { label: "Profile Settings", to: "/profile", icon: "⚙️" },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "20px" }}>{action.icon}</span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
};
