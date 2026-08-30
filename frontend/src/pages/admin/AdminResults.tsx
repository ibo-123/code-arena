import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { contestApi } from '../../services/contestApi'
import { tournamentApi } from '../../services/tournamentApi'
import type { Contest, Result, Tournament } from '../../types'

export const AdminResults = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [contests, setContests] = useState<Contest[]>([])
  const [selectedContestId, setSelectedContestId] = useState<string>('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null
        setTournament(t)
        if (t) {
          return contestApi.list(t._id)
        }
        return { contests: [] }
      })
      .then(({ contests: rows }) => {
        setContests(rows)
        if (rows.length > 0) {
          setSelectedContestId(rows[0]._id)
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const loadResults = () => {
    if (!tournament || !selectedContestId) return
    contestApi.results(tournament._id, selectedContestId)
      .then(({ results: rows }) => setResults(rows))
      .catch((err: Error) => setError(err.message))
  }

  useEffect(loadResults, [tournament, selectedContestId])

  const handleSync = async () => {
    if (!tournament || !selectedContestId) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await contestApi.sync(tournament._id, selectedContestId)
      const stats = res.stats || { matched: 0, unmatched: 0 }
      setNotice(`Synchronized ${stats.matched || 0} results. Unmatched handles: ${stats.unmatched || 0}.`)
      loadResults()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Loading contest results management..." />
  if (error) return <ErrorState error={error} />
  if (!tournament) return <EmptyState label="No active tournament found." />

  const currentContest = contests.find((c) => c._id === selectedContestId)

  return (
    <>
      <header className="page-heading">
        <div>
          <small>SCORE SYNCHRONIZATION</small>
          <h1>Contest Results</h1>
        </div>
        {currentContest && (
          <Button disabled={busy} onClick={handleSync}>
            {busy ? 'Syncing...' : 'Sync Codeforces Standings'}
          </Button>
        )}
      </header>

      {notice && <p className="admin-message" style={{ color: 'var(--green)', marginBottom: 16 }}>{notice}</p>}

      {contests.length > 0 ? (
        <>
          <div className="contest-tabs">
            {contests.map((c) => (
              <button
                key={c._id}
                className={c._id === selectedContestId ? 'active' : ''}
                onClick={() => setSelectedContestId(c._id)}
              >
                {c.name} ({c.round})
              </button>
            ))}
          </div>

          <Card className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Participant</th>
                    <th>Codeforces Username</th>
                    <th>Solved</th>
                    <th>Score</th>
                    <th>Penalty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length ? (
                    results.map((res) => (
                      <tr key={res._id}>
                        <td>#{res.rank}</td>
                        <td>
                          <strong>{res.participant?.user?.name || res.participant?.user?.username || '—'}</strong>
                        </td>
                        <td><small>{res.participant?.user?.codeforcesUsername || '—'}</small></td>
                        <td>{res.solved}</td>
                        <td className="purple">{res.score}</td>
                        <td>{res.penalty}</td>
                        <td>
                          <Badge tone="green">SYNCED</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState label="No results synced for this contest yet. Click 'Sync Codeforces Standings' above." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <EmptyState label="No attached contests to display results for." />
      )}
    </>
  )
}

export default AdminResults
