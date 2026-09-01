import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { contestApi } from '../services/contestApi'
import { tournamentApi } from '../services/tournamentApi'
import type { Contest, LeaderboardEntry } from '../types'

export const ContestDetails = () => {
  const { contestId } = useParams<{ contestId: string }>()
  const [contest, setContest] = useState<Contest | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contestId) return

    const fetchContest = async () => {
      try {
        setLoading(true)
        setError('')

        // 1. Fetch all tournaments
        const { tournaments } = await tournamentApi.list()
        if (!tournaments || tournaments.length === 0) {
          throw new Error('No tournaments found')
        }

        let foundTournamentId: string | null = null
        let contestDetail: Contest | null = null

        // 2. Find the tournament that contains this contest
        for (const tournament of tournaments) {
          try {
            // Try to fetch the contest for this tournament
            const contestResponse = await contestApi.get(tournament._id, contestId)
            // If it succeeds, we have the correct tournament
            foundTournamentId = tournament._id
            contestDetail = contestResponse.contest
            break
          } catch (_) {
            // Contest not found for this tournament – continue searching
            continue
          }
        }

        if (!foundTournamentId || !contestDetail) {
          throw new Error('Contest not found in any tournament')
        }

        // 3. Fetch leaderboard using the correct tournament + contest
        const leaderboardResponse = await contestApi.leaderboard(foundTournamentId, contestId)
        const leaderboardData = leaderboardResponse.leaderboard || []

        setContest(contestDetail)
        setLeaderboard(leaderboardData)
      } catch (err: any) {
        setError(err.message || 'Failed to load contest details')
      } finally {
        setLoading(false)
      }
    }

    fetchContest()
  }, [contestId])

  if (loading) return <LoadingState label="Loading contest details..." />
  if (error) return <ErrorState error={error} />
  if (!contest) return <EmptyState label="Contest not found." />

  // ---- Field mapping ----
  const contestName = contest.name || contest.codeforcesContestName || 'Unnamed Contest'
  const contestStage = contest.round || contest.stage || '—'
  const contestGroup = contest.group || ''
  const durationMinutes = contest.durationMinutes ?? Math.floor((contest.durationSeconds || 0) / 60)
  const startTime = contest.startTime ? new Date(contest.startTime) : null

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <div style={{ marginBottom: 16 }}>
          <Link to="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sub)' }}>
            <ArrowLeft size={16} /> Back to Live Contests
          </Link>
        </div>

        <header className="page-heading">
          <div>
            <small>
              {contestStage}
              {contestGroup && ` · GROUP ${contestGroup}`}
            </small>
            <h1>{contestName}</h1>
          </div>
          {/* ✅ Fixed: removed invalid 'COMPLETED' check */}
          <Badge
            tone={
              contest.status === 'LIVE'
                ? 'red'
                : contest.status === 'FINISHED'
                ? 'green'
                : 'blue'
            }
          >
            {contest.status}
          </Badge>
        </header>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <small>CODEFORCES CONTEST ID: {contest.codeforcesContestId}</small>
              <p style={{ margin: '8px 0 0', color: 'var(--sub)' }}>
                Start Time: {startTime ? startTime.toLocaleString() : 'TBD'} | Duration: {durationMinutes} minutes
              </p>
            </div>
            {contest.codeforcesUrl && (
              <a
                href={contest.codeforcesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                View on Codeforces <ExternalLink size={14} />
              </a>
            )}
          </div>
        </Card>

        <Card className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Participant</th>
                  <th>Codeforces Handle</th>
                  <th>Solved</th>
                  <th>Score</th>
                  <th>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length ? (
                  leaderboard.map((entry) => (
                    <tr key={entry.participantId}>
                      <td>#{entry.rank}</td>
                      <td><strong>{entry.username}</strong></td>
                      <td><small>{entry.codeforcesUsername}</small></td>
                      <td>{entry.solved}</td>
                      <td className="purple">{entry.score}</td>
                      <td>{entry.penalty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState label="No results recorded for this contest." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  )
}

export default ContestDetails