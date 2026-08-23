import { useEffect, useState } from "react";
import {
  Crown,
  Trophy,
  Users,
  Medal,
  Star,
  CheckCircle,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { tournamentApi } from "../services/tournamentApi";
import type {
  Tournament,
  Bracket as BracketType,
  Match,
  Participant,
} from "../types";

export const Bracket = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null;
        setTournament(t);
        if (t) {
          return tournamentApi.bracket(t._id);
        }
        return null;
      })
      .then((result) => {
        if (result) {
          setBracket(result.bracket);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const isCompleted = tournament?.status === "COMPLETED";
  const hasChampion = bracket?.champion;

  const MatchCard = ({
    match,
    isFinal,
  }: {
    match: Match;
    isFinal?: boolean;
  }) => (
    <div
      className="match-card-wrapper"
      style={{
        position: "relative",
        marginBottom: "16px",
      }}
    >
      {isFinal && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "12px",
            padding: "2px 14px",
            borderRadius: "100px",
            background: "linear-gradient(135deg, #FFD700, #FFA000)",
            fontSize: "9px",
            fontWeight: "700",
            color: "#0a0e1a",
            textTransform: "uppercase",
            letterSpacing: "1px",
            zIndex: 2,
          }}
        >
          Final
        </div>
      )}
      <Card
        style={{
          padding: "16px 20px",
          background: isFinal
            ? "rgba(255,215,0,0.05)"
            : "rgba(255,255,255,0.03)",
          border: isFinal
            ? "1px solid rgba(255,215,0,0.2)"
            : "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isFinal
                  ? "rgba(255,215,0,0.15)"
                  : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: isFinal ? "#FFD700" : "rgba(255,255,255,0.4)",
              }}
            >
              {match.matchNumber}
            </div>
            <small
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Match {match.matchNumber}
            </small>
          </div>
          <Badge
            tone={
              match.status === "COMPLETED"
                ? "green"
                : match.status === "LIVE"
                  ? "red"
                  : "muted"
            }
          >
            {match.status === "COMPLETED" && (
              <CheckCircle size={12} style={{ marginRight: "4px" }} />
            )}
            {match.status === "LIVE" && (
              <Clock size={12} style={{ marginRight: "4px" }} />
            )}
            {match.status || "PENDING"}
          </Badge>
        </div>

        {match.participants && match.participants.length > 0 ? (
          match.participants.map((p: Participant) => {
            const isWinner = match.winner?._id === p._id;
            return (
              <div
                key={p._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  background: isWinner
                    ? "rgba(255,215,0,0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: isWinner
                    ? "1px solid rgba(255,215,0,0.15)"
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: isWinner ? "#FFD700" : "rgba(255,255,255,0.8)",
                    fontWeight: isWinner ? "600" : "400",
                  }}
                >
                  {p.user?.username || "Unknown"}
                </span>
                {isWinner && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Crown size={14} color="#FFD700" />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#FFD700",
                        fontWeight: "600",
                      }}
                    >
                      Winner
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: "13px",
            }}
          >
            Match pending
          </div>
        )}
      </Card>
    </div>
  );

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
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Trophy size={20} color="#FFD700" />
              <small
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Code Arena 2026
              </small>
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 3vw, 42px)",
                fontWeight: "700",
                margin: 0,
                background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Championship Bracket
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginTop: "4px",
              }}
            >
              {hasChampion ? "🏆 Champion crowned!" : "The road to glory"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {hasChampion && (
              <Badge
                tone="gold"
                style={{
                  padding: "6px 16px",
                  borderRadius: "100px",
                  background: "linear-gradient(135deg, #FFD700, #FFA000)",
                  fontWeight: "700",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Crown size={16} />
                Champion
              </Badge>
            )}
            <Badge tone={isCompleted ? "gold" : "blue"}>
              {tournament?.status || "REGISTRATION"}
            </Badge>
          </div>
        </header>

        {/* Bracket Grid */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "32px auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Group Stage */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Users size={18} color="#4CAF50" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  margin: 0,
                  color: "white",
                }}
              >
                GROUP STAGE
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {bracket?.groupStage ? (
                Object.entries(bracket.groupStage).map(([group, players]) => (
                  <div
                    key={group}
                    style={{
                      marginBottom: "16px",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <small
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#4CAF50",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Group {group}
                      </small>
                      <Badge tone="muted" style={{ fontSize: "10px" }}>
                        {players.length} players
                      </Badge>
                    </div>
                    {players.length > 0 ? (
                      players.map((p) => (
                        <div
                          key={p._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.3)",
                                fontWeight: "600",
                                minWidth: "32px",
                              }}
                            >
                              #{p.seed || "—"}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color:
                                  p.status === "ELIMINATED"
                                    ? "rgba(255,255,255,0.3)"
                                    : "rgba(255,255,255,0.8)",
                              }}
                            >
                              {p.user?.username || "Unknown"}
                            </span>
                          </div>
                          <Badge
                            tone={p.status === "ELIMINATED" ? "muted" : "green"}
                            style={{
                              fontSize: "10px",
                              padding: "2px 10px",
                            }}
                          >
                            {p.status || "ACTIVE"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.3)",
                          fontSize: "13px",
                        }}
                      >
                        Awaiting draw
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState label="Groups not yet drawn" />
              )}
            </div>
          </div>

          {/* Quarter Finals */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Medal size={18} color="#FF9800" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  margin: 0,
                  color: "white",
                }}
              >
                QUARTER FINALS
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {bracket?.quarterFinal && bracket.quarterFinal.length > 0 ? (
                bracket.quarterFinal.map((match) => (
                  <MatchCard key={match.matchNumber} match={match} />
                ))
              ) : (
                <EmptyState label="Quarter finals pending" />
              )}
            </div>
          </div>

          {/* Semi Finals */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Star size={18} color="#9C27B0" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  margin: 0,
                  color: "white",
                }}
              >
                SEMIFINALS
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {bracket?.semiFinal && bracket.semiFinal.length > 0 ? (
                bracket.semiFinal.map((match) => (
                  <MatchCard key={match.matchNumber} match={match} />
                ))
              ) : (
                <EmptyState label="Semifinals pending" />
              )}
            </div>
          </div>

          {/* Grand Final & Champion */}
          <div
            style={{
              background: "rgba(255,215,0,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,215,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(255,215,0,0.05)",
                borderBottom: "1px solid rgba(255,215,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Crown size={18} color="#FFD700" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#FFD700",
                }}
              >
                GRAND FINAL
              </h3>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {bracket?.final ? (
                <MatchCard match={bracket.final} isFinal />
              ) : (
                <EmptyState label="Finalists pending" />
              )}

              {/* Champion Card */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "20px",
                  borderRadius: "12px",
                  background: hasChampion
                    ? "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))"
                    : "rgba(255,255,255,0.02)",
                  border: hasChampion
                    ? "1px solid rgba(255,215,0,0.2)"
                    : "1px solid rgba(255,255,255,0.04)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: hasChampion
                        ? "linear-gradient(135deg, #FFD700, #FFA000)"
                        : "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    <Crown
                      size={28}
                      color={hasChampion ? "#0a0e1a" : "rgba(255,255,255,0.2)"}
                    />
                  </div>
                  <small
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    {hasChampion ? "🏆 CHAMPION" : "CHAMPION"}
                  </small>
                  <strong
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: hasChampion ? "#FFD700" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {hasChampion
                      ? bracket?.champion?.user?.username
                      : "To be crowned"}
                  </strong>
                  {hasChampion && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      <CheckCircle size={14} color="#4CAF50" />
                      Tournament Champion
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bracket Flow Indicator */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "32px auto 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            padding: "16px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Tournament Flow
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <span>Groups</span>
            <ArrowRight size={14} />
            <span>QF</span>
            <ArrowRight size={14} />
            <span>SF</span>
            <ArrowRight size={14} />
            <span style={{ color: "#FFD700", fontWeight: "600" }}>Final</span>
            <ArrowRight size={14} />
            <span style={{ color: "#FFD700", fontWeight: "700" }}>
              {hasChampion ? "🏆" : "Champion"}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .match-card-wrapper {
            animation: fadeIn 0.3s ease;
          }
        `}</style>
      </main>
    </>
  );
};
