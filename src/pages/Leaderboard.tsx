import { useEffect, useState, useMemo } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { LeaderboardEntry } from '../types'

export const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('ALL')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (t) {
          return tournamentApi.leaderboard(t._id)
        }
        return null
      })
      .then((result) => {
        if (result) {
          setEntries(result.leaderboard)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const matchesGroup = group === 'ALL' || entry.group === group
        const matchesSearch = entry.username.toLowerCase().includes(query.toLowerCase()) ||
          entry.codeforcesUsername.toLowerCase().includes(query.toLowerCase())
        return matchesGroup && matchesSearch
      })
      .sort((a, b) => a.rank - b.rank)
  }, [entries, group, query])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-1'
    if (rank === 2) return 'rank-2'
    if (rank === 3) return 'rank-3'
    return ''
  }

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <header className="page-heading">
          <div>
            <small>CHAMPIONSHIP STANDINGS</small>
            <h1>Leaderboard</h1>
          </div>
          <div className="filters">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search competitor..."
            />
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="ALL">Overall</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
              <option value="C">Group C</option>
              <option value="D">Group D</option>
            </select>
          </div>
        </header>

        <Card className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Participant</th>
                  <th>Group</th>
                  <th>Group Rank</th>
                  <th>Score</th>
                  <th>Solved</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((entry) => (
                    <tr key={entry.participantId}>
                      <td>
                        <span className={getRankClass(entry.rank)}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td>
                        <strong>{entry.username}</strong>
                        <small>{entry.codeforcesUsername}</small>
                      </td>
                      <td>{entry.group || '—'}</td>
                      <td>#{entry.rank}</td>
                      <td className="purple">{entry.score}</td>
                      <td>{entry.solved}</td>
                      <td>—</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState label="No participants found." />
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
