import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import { contestApi } from '../services/contestApi'
import type { Contest, LeaderboardEntry } from '../types'

export const Live = () => {
  const [contests, setContests] = useState<Contest[]>([])
  const [selected, setSelected] = useState<Contest | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tournamentId, setTournamentId] = useState<string | null>(null)

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (t) {
          setTournamentId(t._id)
          return contestApi.list(t._id)
        }
        return null
      })
      .then((result) => {
        if (result) {
          setContests(result.contests)
          const live = result.contests.find((c) => c.status === 'LIVE')
          setSelected(live || result.contests[0] || null)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!tournamentId || !selected) return

    let interval: number | undefined

    const load = () => {
      contestApi.leaderboard(tournamentId!, selected!._id)
        .then((result) => setEntries(result.leaderboard))
        .catch(() => {})
    }

    load()

    if (selected.status === 'LIVE') {
      interval = window.setInterval(load, 15000)
    }

    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [tournamentId, selected])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <header className="page-heading">
          <div>
            <small><Radio size={14} color="#FF1744" /> LIVE SCOREBOARD</small>
            <h1>{selected?.name || 'Live Contest'}</h1>
            <p>Codeforces #{selected?.codeforcesContestId || '—'} · {selected?.durationMinutes || 0} minutes</p>
          </div>
          <Badge tone={selected?.status === 'LIVE' ? 'red' : selected?.status === 'FINISHED' ? 'green' : 'muted'}>
            {selected?.status || 'NO CONTEST'}
          </Badge>
        </header>

        {contests.length > 1 && (
          <div className="contest-tabs">
            {contests.map((contest) => (
              <button key={contest._id} className={selected?._id === contest._id ? 'active' : ''} onClick={() => setSelected(contest)}>
                {contest.name}
              </button>
            ))}
          </div>
        )}

        <Card className="table-card">
          <p className="sync-label">Last synchronized: 15 seconds ago</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Rank</th><th>Participant</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>Solved</th><th>Penalty</th><th>Score</th></tr>
              </thead>
              <tbody>
                {entries.length ? entries.map((entry) => (
                  <tr key={entry.participantId}>
                    <td>#{entry.rank}</td>
                    <td><strong>{entry.username}</strong><small>{entry.codeforcesUsername}</small></td>
                    {['A','B','C','D','E'].map((problem) => {
                      const result = entry.problemResults?.find((r) => r.problemIndex === problem)
                      let className = 'text-center'
                      if (result?.status === 'SOLVED') className += ' text-[#00E676]'
                      else if (result?.status === 'FAILED') className += ' text-[#FF1744]'
                      else className += ' text-[#61718F]'
                      return <td key={problem} className={className}>{result?.status === 'SOLVED' ? '✓' : result?.status === 'FAILED' ? '✗' : '—'}</td>
                    })}
                    <td>{entry.solved}</td><td>{entry.penalty}</td><td className="purple">{entry.score}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={10}><EmptyState label="No matched Codeforces standings yet." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  )
}
