// frontend/src/pages/public/Tournaments.tsx
import { useEffect, useState } from "react";
import { Trophy, Search, Filter, Calendar, Users, ChevronDown, X } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament } from "../../types";

export const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => setTournaments(tournaments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Get unique statuses from tournaments
  const availableStatuses = ["all", ...new Set(tournaments.map((t) => t.status))];

  const filtered = tournaments
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || t.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "participants") {
        return (b.participantCount || 0) - (a.participantCount || 0);
      }
      return 0;
    });

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setSortBy("newest");
  };

  const activeFilterCount = (filter !== "all" ? 1 : 0) + (search ? 1 : 0);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="tournaments-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <div className="header-badge">
              <Trophy size={16} />
              Tournament Hub
            </div>
            <h1>All Tournaments</h1>
            <p>Browse and join competitive programming tournaments</p>
          </div>
          <div className="header-stats">
            <div className="stat-chip">
              <span className="stat-number">{tournaments.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-chip">
              <span className="stat-number">
                {
                  tournaments.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
                    .length
                }
              </span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-chip">
              <span className="stat-number">
                {tournaments.reduce((sum, t) => sum + (t.participantCount || 0), 0)}
              </span>
              <span className="stat-label">Participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tournaments by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filters-actions">
          <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            Filters
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            <ChevronDown size={16} className={`chevron ${showFilters ? "open" : ""}`} />
          </button>

          {(filter !== "all" || search || sortBy !== "newest") && (
            <button className="clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="filters-expanded">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  className={`filter-option ${filter === status ? "active" : ""}`}
                  onClick={() => setFilter(status)}
                >
                  {status === "all" ? "All" : status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <div className="filter-options">
              {[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "participants", label: "Most Participants" },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`filter-option ${sortBy === option.value ? "active" : ""}`}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <span>
          Showing <strong>{filtered.length}</strong> tournament{filtered.length !== 1 ? "s" : ""}
          {filter !== "all" && (
            <>
              {" "}
              with status <StatusBadge status={filter} size="sm" />
            </>
          )}
        </span>
      </div>

      {/* Tournaments Grid */}
      {filtered.length > 0 ? (
        <div className="tournaments-grid">
          {filtered.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={48} />
          </div>
          <h3>No tournaments found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button className="btn-primary" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
