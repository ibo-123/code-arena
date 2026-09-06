
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
    if (!contestId) {
      setError('Contest ID is missing')
      setLoading(false)
      return
    }

    const fetchContest = async () => {
      try {
        setLoading(true)
        setError('')

        /*
         * Find the tournament containing this contest.
         */
        const tournamentResponse = await tournamentApi.list()
        const tournaments = tournamentResponse.tournaments || []

        if (!tournaments.length) {
          throw new Error('No tournaments found')
        }

        let foundTournamentId: string | null = null
        let foundContest: Contest | null = null

        for (const tournament of tournaments) {
          try {
            const response = await contestApi.get(
              tournament._id,
              contestId
            )

            if (response?.contest) {
              foundTournamentId = tournament._id
              foundContest = response.contest
              break
            }
          } catch {
            // Contest does not belong to this tournament.
            continue
          }
        }

        if (!foundTournamentId || !foundContest) {
          throw new Error('Contest not found')
        }

        /*
         * Fetch leaderboard only after we know the
         * correct tournament.
         */
        const leaderboardResponse = await contestApi.leaderboard(
          foundTournamentId,
          contestId
        )

        setContest(foundContest)
        setLeaderboard(
          leaderboardResponse?.leaderboard || []
        )
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load contest details'

        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchContest()
  }, [contestId])

  if (loading) {
    return <LoadingState label="Loading contest details..." />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!contest) {
    return <EmptyState label="Contest not found." />
  }

  /*
   * Contest fields
   *
   * IMPORTANT:
   * Use `stage`, not `round`.
   */
  const contestName =
    contest.name ||
    contest.codeforcesContestName ||
    'Unnamed Contest'

  const contestStage =
    contest.stage || '—'

  const contestGroup =
    contest.group || ''

  const durationMinutes =
    contest.durationMinutes ??
    Math.floor((contest.durationSeconds || 0) / 60)

  const startTime =
    contest.startTime
      ? new Date(contest.startTime)
      : null

  return (
    <>
      <Navbar />

      <main className="page public-page">
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/live"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--sub)',
            }}
          >
            <ArrowLeft size={16} />
            Back to Live Contests
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div>
              <small>
                CODEFORCES CONTEST ID:{' '}
                {contest.codeforcesContestId}
              </small>

              <p
                style={{
                  margin: '8px 0 0',
                  color: 'var(--sub)',
                }}
              >
                Start Time:{' '}
                {startTime
                  ? startTime.toLocaleString()
                  : 'TBD'}
                {' | '}
                Duration: {durationMinutes} minutes
              </p>
            </div>

            {contest.codeforcesUrl && (
              <a
                href={contest.codeforcesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                View on Codeforces
                <ExternalLink size={14} />
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
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <tr
                      key={
                        entry.participantId ||
                        entry.codeforcesUsername
                      }
                    >
                      <td>#{entry.rank}</td>

                      <td>
                        <strong>
                          {entry.username || 'Unknown'}
                        </strong>
                      </td>

                      <td>
                        <small>
                          {entry.codeforcesUsername || '—'}
                        </small>
                      </td>

                      <td>{entry.solved ?? 0}</td>

                      <td className="purple">
                        {entry.score ?? 0}
                      </td>

                      <td>{entry.penalty ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        label="No results recorded for this contest."
                      />
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
