import { useEffect, useState } from "react";
import { Crown, ChevronRight, Trophy } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { tournamentApi } from "../services/tournamentApi";
import type { Tournament, Bracket as BracketType, Match, Participant } from "../types";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  // ---- Match Card ----
  const MatchCard = ({ match }: { match: Match }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
        width: "100%",
        maxWidth: "280px",
        margin: "0 auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
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
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>
          Match {match.matchNumber}
        </span>
        <Badge
          tone={match.status === "COMPLETED" ? "green" : match.status === "LIVE" ? "red" : "muted"}
          style={{ fontSize: "10px", padding: "2px 8px" }}
        >
          {match.status}
        </Badge>
      </div>

      {match.participants.map((p: Participant) => {
        const isWinner = match.winner?._id === p._id;
        return (
          <div
            key={p._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              marginBottom: "6px",
              borderRadius: "8px",
              background: isWinner ? "rgba(255,215,0,0.08)" : "transparent",
              border: isWinner ? "1px solid rgba(255,215,0,0.25)" : "1px solid transparent",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isWinner
                  ? "linear-gradient(135deg, #FFD700, #F57C00)"
                  : "linear-gradient(135deg, #64B5F6, #1565C0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(p.user.username)}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: "14px",
                fontWeight: isWinner ? "600" : "400",
                color: isWinner ? "#FFD700" : "rgba(255,255,255,0.9)",
              }}
            >
              {p.user.username}
            </span>
            {isWinner && <Crown size={16} color="#FFD700" style={{ flexShrink: 0 }} />}
          </div>
        );
      })}

      {match.contest && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
          }}
        >
          Contest #{match.contest.codeforcesContestId}
        </div>
      )}
    </div>
  );

  // ---- Group Card ----
  const GroupCard = ({ group, players }: { group: string; players: Participant[] }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        width: "100%",
        maxWidth: "280px",
        margin: "0 auto",
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
        <span style={{ fontSize: "14px", fontWeight: "700", color: "#64B5F6" }}>Group {group}</span>
        <Badge tone="blue" style={{ fontSize: "10px" }}>
          {players.length} participants
        </Badge>
      </div>
      {players.length ? (
        players.map((p) => (
          <div
            key={p._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              marginBottom: "4px",
              background: p.status === "ELIMINATED" ? "rgba(255,0,0,0.05)" : "transparent",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #78909C, #37474F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "700",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(p.user.username)}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: "13px",
                color:
                  p.status === "ELIMINATED" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)",
              }}
            >
              #{p.seed} {p.user.username}
            </span>
            <Badge
              tone={p.status === "ELIMINATED" ? "muted" : "green"}
              style={{ fontSize: "9px", padding: "1px 6px" }}
            >
              {p.status}
            </Badge>
          </div>
        ))
      ) : (
        // FIX: wrap EmptyState in a div to apply padding
        <div style={{ padding: "20px 0" }}>
          <EmptyState label="Awaiting draw" />
        </div>
      )}
    </div>
  );

  // ---- Render ----
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
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: "40px",
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
              <div
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}
              >
                CODE ARENA 2026
              </div>
              <h1
                style={{
                  fontSize: "clamp(32px, 5vw, 52px)",
                  fontWeight: "800",
                  margin: "0 0 6px 0",
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                Championship Bracket
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "16px" }}>
                The road to the crown
              </p>
            </div>
            <Badge
              tone={tournament?.status === "COMPLETED" ? "gold" : "blue"}
              style={{ fontSize: "14px", padding: "8px 20px" }}
            >
              {tournament?.status || "REGISTRATION"}
            </Badge>
          </header>

          {/* Bracket columns - horizontal scroll on small screens */}
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "32px",
              overflowX: "auto",
              paddingBottom: "20px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.2) transparent",
            }}
          >
            {/* Group Stage */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                GROUP STAGE
              </h3>
              {bracket?.groupStage ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {Object.entries(bracket.groupStage).map(([group, players]) => (
                    <GroupCard key={group} group={group} players={players} />
                  ))}
                </div>
              ) : (
                <EmptyState label="Groups not yet drawn" />
              )}
            </section>

            {/* Connector arrow (for visual flow) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Quarter Finals */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                QUARTER FINALS
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bracket?.quarterFinal?.length ? (
                  bracket.quarterFinal.map((match) => (
                    <MatchCard key={match.matchNumber} match={match} />
                  ))
                ) : (
                  <EmptyState label="Quarter finals pending" />
                )}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Semi Finals */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                SEMIFINALS
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bracket?.semiFinal?.length ? (
                  bracket.semiFinal.map((match) => (
                    <MatchCard key={match.matchNumber} match={match} />
                  ))
                ) : (
                  <EmptyState label="Semifinals pending" />
                )}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Final & Champion */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                GRAND FINAL
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {bracket?.final ? (
                  <MatchCard match={bracket.final} />
                ) : (
                  <EmptyState label="Finalists pending" />
                )}

                {/* Champion Card */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "280px",
                    background:
                      "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,152,0,0.05))",
                    borderRadius: "16px",
                    padding: "24px 20px",
                    border: "1px solid rgba(255,215,0,0.2)",
                    textAlign: "center",
                    marginTop: "12px",
                    boxShadow: "0 8px 32px rgba(255,215,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
                      padding: "0 12px",
                    }}
                  >
                    <Trophy size={32} color="#FFD700" />
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <small
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                      }}
                    >
                      CHAMPION
                    </small>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        margin: "8px 0",
                        background: "linear-gradient(135deg, #FFD700, #F57C00)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {bracket?.champion?.user.username || "To be crowned"}
                    </div>
                    {bracket?.champion && (
                      <Badge tone="gold" style={{ fontSize: "12px", padding: "4px 16px" }}>
                        🏆 CHAMPION
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};
