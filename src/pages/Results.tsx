import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import { contestApi } from '../services/contestApi'
import type { Contest, ContestResult } from '../types'

export const Results = () => {
  const { contestId } = useParams()
  const [contest, setContest] = useState<Contest | null>(null)
  const [results, setResults] = useState<ContestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (t && contestId) {
          return Promise.all([contestApi.get(t._id, contestId), contestApi.results(t._id, contestId)])
        }
        return null
      })
      .then((result) => { if (result) { setContest(result[0].contest); setResults(result[1].results) } })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [contestId])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <header className="page-heading">
          <div><small>{contest?.round?.replace('_', ' ') || 'CONTEST'}</small><h1>Official Results</h1><p>Official final standing.</p></div>
          <Badge tone="green">LOCK COMPLETED</Badge>
        </header>
        <Card className="table-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Participant</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>Solved</th><th>Penalty</th><th>Result</th></tr></thead>
              <tbody>
                {results.length ? results.map((result) => {
                  const isAdvancing = result.participant.status === 'ADVANCED'
                  return (
                    <tr key={result._id}>
                      <td>#{result.rank}</td>
                      <td><strong>{result.participant.user.username}</strong></td>
                      {['A','B','C','D','E'].map((problem) => {
                        const p = result.problemResults?.find((r) => r.problemIndex === problem)
                        let className = 'text-center'
                        if (p?.status === 'SOLVED') className += ' text-[#00E676]'
                        else if (p?.status === 'FAILED') className += ' text-[#FF1744]'
                        else className += ' text-[#61718F]'
                        return <td key={problem} className={className}>{p?.status === 'SOLVED' ? '✓' : p?.status === 'FAILED' ? '✗' : '—'}</td>
                      })}
                      <td>{result.solved}</td><td>{result.penalty}</td>
                      <td><Badge tone={isAdvancing ? 'green' : 'muted'}>{isAdvancing ? 'ADVANCING' : 'ELIMINATED'}</Badge></td>
                    </tr>
                  )
                }) : <tr><td colSpan={10}><EmptyState label="No results available." /></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  )
}
