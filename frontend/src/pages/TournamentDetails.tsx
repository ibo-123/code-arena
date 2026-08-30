import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  MapPin,
  Target,
  Zap,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { useAuth } from "../context/AuthContext";
import { tournamentApi } from "../services/tournamentApi";
import type { Tournament, Participant } from "../types";
import { AxiosError } from "axios";

export const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [tournamentRes, participantsRes] = await Promise.all([
          tournamentApi.get(id),
          tournamentApi.participants(id),
        ]);

        const t = tournamentRes.tournament;
        setTournament(t);
        setParticipantCount(participantsRes.participants.length);

        if (isAuthenticated && user) {
          const userParticipant = participantsRes.participants.find(
            (p) => p.user._id === user._id || p.user.id === user.id,
          );
          if (userParticipant) {
            setParticipant(userParticipant);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tournament details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, isAuthenticated, user]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (!id) return;

    try {
      setRegistering(true);
      setRegisterError("");
      const result = await tournamentApi.join(id);

      setRegisterSuccess(true);
      setParticipant(result.participant);
      setParticipantCount((prev) => prev + 1);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setRegisterError(err.response.data.message);
      } else if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError("Server error");
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <ErrorState error="Tournament not found" />;

  // ---------- Time‑based state computation ----------
  const now = currentTime;

  const registrationStart = tournament.registrationStart
    ? new Date(tournament.registrationStart)
    : null;
  const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
  const tournamentStart = tournament.startDate ? new Date(tournament.startDate) : null;

  const hasTournamentStarted = tournamentStart !== null && now >= tournamentStart;

  const isRegistrationNotStarted = registrationStart !== null && now < registrationStart;

  const isRegistrationClosed =
    registrationEnd !== null && now >= registrationEnd && !hasTournamentStarted;

  const isRegistrationOpen =
    registrationStart !== null &&
    registrationEnd !== null &&
    now >= registrationStart &&
    now < registrationEnd &&
    !hasTournamentStarted;

  // ---------- UI helpers ----------
  const maxParticipants = tournament.maxParticipants || 20;
  const availableSlots = Math.max(0, maxParticipants - participantCount);
  const isFull = participantCount >= maxParticipants;
  const isRegistered = !!participant;

  const getDate = (date: string | Date | undefined, fallback: string = "TBD") => {
    if (!date) return fallback;
    return new Date(date).toLocaleString();
  };

  // Countdown until registration opens (if not started)
  const getCountdown = (target: Date | null) => {
    if (!target) return null;
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const registrationCountdown = isRegistrationNotStarted ? getCountdown(registrationStart) : null;
  const tournamentCountdown = hasTournamentStarted ? null : getCountdown(tournamentStart);

  // Determine status display
  const getStatusBadge = () => {
    if (hasTournamentStarted) return { tone: "gold", label: "LIVE" };
    if (isRegistrationOpen) return { tone: "blue", label: "REGISTRATION OPEN" };
    if (isRegistrationNotStarted) return { tone: "muted", label: "UPCOMING" };
    if (isRegistrationClosed) return { tone: "red", label: "CLOSED" };
    return { tone: "muted", label: tournament.status };
  };

  const status = getStatusBadge();

  // ---------- Render ----------
  return (
    <>
      <Navbar />
      <main
        style={{
          background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              marginBottom: "36px",
              borderBottom: "2px solid rgba(41, 121, 255, 0.2)",
              paddingBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <Badge
                tone={status.tone as any}
                style={{
                  fontSize: "11px",
                  padding: "4px 14px",
                  borderRadius: "100px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "inline-block",
                  background:
                    status.tone === "gold"
                      ? "linear-gradient(135deg, #FFD700, #FFA000)"
                      : status.tone === "blue"
                        ? "linear-gradient(135deg, #2979FF, #1565C0)"
                        : status.tone === "red"
                          ? "linear-gradient(135deg, #F44336, #C62828)"
                          : "rgba(255,255,255,0.1)",
                }}
              >
                {status.label}
              </Badge>
              <h1
                style={{
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  fontWeight: "800",
                  margin: "0 0 8px 0",
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                {tournament.name}
              </h1>
              {tournament.description && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "16px",
                    lineHeight: "1.7",
                    maxWidth: "700px",
                    margin: "4px 0 0",
                  }}
                >
                  {tournament.description}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.05)",
                  padding: "8px 16px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Users size={18} color="#64B5F6" />
                <span style={{ fontWeight: "600" }}>{participantCount}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>participants</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "28px",
            }}
          >
            {/* Registration Card */}
            <Card
              style={{
                padding: "32px",
                background: "rgba(20, 25, 45, 0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                gridColumn: "1 / -1",
                backdropFilter: "blur(8px)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-30%",
                  width: "400px",
                  height: "400px",
                  background: "radial-gradient(circle, rgba(41,121,255,0.08) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {registerSuccess ? (
                  <div
                    style={{
                      background: "rgba(76, 175, 80, 0.12)",
                      border: "1px solid rgba(76, 175, 80, 0.35)",
                      padding: "28px",
                      borderRadius: "16px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}
                    >
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          background: "rgba(76, 175, 80, 0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2 size={36} color="#4CAF50" />
                      </div>
                    </div>
                    <h2 style={{ color: "#4CAF50", margin: "0 0 8px 0", fontSize: "26px" }}>
                      🎉 Registration Successful!
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.85)", margin: "0 0 6px 0" }}>
                      You are now registered for <strong>{tournament.name}</strong>.
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        margin: "0 0 28px 0",
                        fontSize: "14px",
                      }}
                    >
                      Your group and seed will be assigned when the tournament starts.
                    </p>
                    <Button
                      onClick={() => setRegisterSuccess(false)}
                      variant="primary"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      View Tournament
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>
                      Registration Status
                    </h2>

                    {registerError && (
                      <div
                        style={{
                          padding: "12px 20px",
                          background: "rgba(244, 67, 54, 0.12)",
                          border: "1px solid rgba(244, 67, 54, 0.3)",
                          color: "#FF6B6B",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "14px",
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        <ShieldAlert size={18} />
                        {registerError}
                      </div>
                    )}

                    {/* Conditional Registration States */}
                    {isRegistered ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          padding: "20px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 24px",
                            background: "rgba(76, 175, 80, 0.15)",
                            color: "#4CAF50",
                            borderRadius: "100px",
                            border: "1px solid rgba(76, 175, 80, 0.3)",
                            fontWeight: "600",
                            fontSize: "16px",
                          }}
                        >
                          <CheckCircle2 size={20} />✓ You are registered
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>
                          You have successfully registered for this tournament.
                        </span>
                      </div>
                    ) : hasTournamentStarted ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 20px",
                            background: "rgba(255, 152, 0, 0.12)",
                            color: "#FFA726",
                            borderRadius: "100px",
                            border: "1px solid rgba(255, 152, 0, 0.3)",
                            fontWeight: "600",
                          }}
                        >
                          <PlayCircle size={18} />
                          Tournament already started
                        </div>
                        <Button disabled variant="secondary" size="lg">
                          Registration Closed
                        </Button>
                      </div>
                    ) : isRegistrationNotStarted ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 20px",
                            background: "rgba(255,255,255,0.06)",
                            color: "white",
                            borderRadius: "100px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            fontWeight: "600",
                          }}
                        >
                          <Clock size={18} />
                          Registration not yet open
                        </div>
                        {registrationCountdown && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.6)",
                              fontSize: "18px",
                              fontWeight: "700",
                              fontVariantNumeric: "tabular-nums",
                              background: "rgba(0,0,0,0.3)",
                              padding: "4px 16px",
                              borderRadius: "8px",
                              letterSpacing: "1px",
                            }}
                          >
                            {registrationCountdown}
                          </span>
                        )}
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          Opens: {getDate(tournament.registrationStart)}
                        </span>
                        <Button disabled variant="secondary" size="lg">
                          Registration Closed
                        </Button>
                      </div>
                    ) : isRegistrationClosed ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 20px",
                            background: "rgba(244, 67, 54, 0.1)",
                            color: "#EF5350",
                            borderRadius: "100px",
                            border: "1px solid rgba(244, 67, 54, 0.3)",
                            fontWeight: "600",
                          }}
                        >
                          <ShieldAlert size={18} />
                          Registration Closed
                        </div>
                        <Button disabled variant="secondary" size="lg">
                          Registration Closed
                        </Button>
                      </div>
                    ) : isFull ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 20px",
                            background: "rgba(244, 67, 54, 0.1)",
                            color: "#EF5350",
                            borderRadius: "100px",
                            border: "1px solid rgba(244, 67, 54, 0.3)",
                            fontWeight: "600",
                          }}
                        >
                          <Users size={18} />
                          Tournament Full
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          {participantCount} / {maxParticipants} participants
                        </span>
                        <Button disabled variant="secondary" size="lg">
                          Registration Closed
                        </Button>
                      </div>
                    ) : (
                      // Open registration
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "20px",
                          padding: "8px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 24px",
                            background: "rgba(41, 121, 255, 0.12)",
                            color: "#64B5F6",
                            borderRadius: "100px",
                            border: "1px solid rgba(41, 121, 255, 0.3)",
                            fontWeight: "600",
                            fontSize: "16px",
                          }}
                        >
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "#64B5F6",
                              boxShadow: "0 0 12px #64B5F6",
                              display: "inline-block",
                              animation: "pulse 1.5s infinite",
                            }}
                          />
                          Registration Open
                        </div>

                        <Button
                          onClick={handleRegister}
                          disabled={registering}
                          size="lg"
                          style={{
                            padding: "16px 48px",
                            fontSize: "18px",
                            background: "linear-gradient(135deg, #2979FF, #1565C0)",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                            boxShadow: "0 4px 20px rgba(41, 121, 255, 0.3)",
                            transition: "transform 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 30px rgba(41, 121, 255, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(41, 121, 255, 0.3)";
                          }}
                        >
                          {registering ? "Registering..." : "REGISTER FOR TOURNAMENT"}
                          {!registering && <ArrowRight size={20} />}
                        </Button>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
                          {availableSlots} slot{availableSlots !== 1 ? "s" : ""} remaining
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Schedule Card */}
            <Card
              style={{
                padding: "24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  color: "white",
                }}
              >
                <Calendar size={22} color="#64B5F6" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Schedule</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Registration Opens
                  </span>
                  <span style={{ fontWeight: "500", textAlign: "right", fontSize: "14px" }}>
                    {getDate(tournament.registrationStart)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Registration Closes
                  </span>
                  <span style={{ fontWeight: "500", textAlign: "right", fontSize: "14px" }}>
                    {getDate(tournament.registrationEnd)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Tournament Starts
                  </span>
                  <span
                    style={{
                      fontWeight: "500",
                      textAlign: "right",
                      fontSize: "14px",
                      color: "#FFD700",
                    }}
                  >
                    {getDate(tournament.startDate)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Tournament Ends
                  </span>
                  <span style={{ fontWeight: "500", textAlign: "right", fontSize: "14px" }}>
                    {getDate(tournament.endDate)}
                  </span>
                </div>
                {tournamentCountdown && !hasTournamentStarted && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "rgba(255,215,0,0.05)",
                      border: "1px solid rgba(255,215,0,0.1)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Starts in
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#FFD700",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {tournamentCountdown}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Format Card */}
            <Card
              style={{
                padding: "24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  color: "white",
                }}
              >
                <Trophy size={22} color="#FFD700" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Format & Structure
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Capacity</span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>
                    {participantCount} / {maxParticipants}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Groups</span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>
                    {tournament.numberOfGroups || 4} Groups
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Group Size
                  </span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>
                    {tournament.participantsPerGroup ||
                      maxParticipants / (tournament.numberOfGroups || 4)}{" "}
                    per group
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Qualifiers
                  </span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>
                    Top {tournament.qualifiersPerGroup || 2} advance
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Playoffs</span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>
                    {tournament.playoffFormat
                      ? tournament.playoffFormat.replace(/_/g, " ")
                      : "SINGLE ELIMINATION"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Animation keyframes for the pulse */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default TournamentDetails;
