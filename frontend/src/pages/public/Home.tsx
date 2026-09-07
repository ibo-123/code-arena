import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState } from "../../components/common/LoadingState";
import { ErrorState } from "../../components/common/ErrorState";
import type { Tournament } from "../../types";

export const Home = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => setTournaments(tournaments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const active = tournaments.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const featured = active.length > 0 ? active[0] : null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="public-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            Championship Series 2026
          </div>
          <h1>Code Arena</h1>
          <p className="hero-subtitle">
            Elite competitive programming tournament where coders battle for the ultimate crown.
          </p>
          <div className="hero-actions">
            <Link to="/tournaments" className="btn-primary">
              View Tournaments
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Featured Tournament Card */}
        {featured && (
          <div className="hero-featured">
            <div className="featured-card">
              <div className="featured-status">
                <span className="status-dot live" />
                {featured.status === "REGISTRATION" ? "Registration Open" : "Live"}
              </div>
              <h3>{featured.name}</h3>
              <p>{featured.description}</p>
              <div className="featured-stats">
                <span>
                  <Users size={14} /> {featured.participantCount || 0} participants
                </span>
                <span>
                  <Calendar size={14} />{" "}
                  {featured.tournamentStart
                    ? new Date(featured.tournamentStart).toLocaleDateString()
                    : "TBD"}
                </span>
              </div>
              <Link to={`/tournaments/${featured._id}`} className="btn-outline">
                View Details
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Tournaments Grid */}
      <section className="tournaments-section">
        <div className="section-header">
          <h2>All Tournaments</h2>
          <Link to="/tournaments" className="btn-outline">
            View All
          </Link>
        </div>

        <div className="tournaments-grid">
          {tournaments.length > 0 ? (
            tournaments.map((t) => <TournamentCard key={t._id} tournament={t} />)
          ) : (
            <div className="empty-state">
              <Trophy size={48} />
              <p>No tournaments available</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
