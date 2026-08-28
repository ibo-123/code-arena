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
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (!t) throw new Error('No tournament found')
        return Promise.all([
          contestApi.get(t._id, contestId),
          contestApi.leaderboard(t._id, contestId),
        ])
      })
      .then(([{ contest: detail }, { leaderboard: rows }]) => {
        setContest(detail)
        setLeaderboard(rows)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [contestId])

  if (loading) return <LoadingState label="Loading contest details..." />
  if (error) return <ErrorState error={error} />
  if (!contest) return <EmptyState label="Contest not found." />

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
            <small>{contest.round} {contest.group ? `· GROUP ${contest.group}` : ''}</small>
            <h1>{contest.name}</h1>
          </div>
          <Badge tone={contest.status === 'LIVE' ? 'red' : contest.status === 'FINISHED' ? 'green' : 'blue'}>
            {contest.status}
          </Badge>
        </header>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <small>CODEFORCES CONTEST ID: {contest.codeforcesContestId}</small>
              <p style={{ margin: '8px 0 0', color: 'var(--sub)' }}>
                Start Time: {new Date(contest.startTime).toLocaleString()} | Duration: {contest.durationMinutes} minutes
              </p>
            </div>
            {contest.codeforcesUrl && (
              <a href={contest.codeforcesUrl} target="_blank" rel="noopener noreferrer" className="button">
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
                      <td><strong>{entry.username || entry.name}</strong></td>
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
