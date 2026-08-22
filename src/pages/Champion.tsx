import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { Tournament, Bracket } from '../types'

export const Champion = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null
        setTournament(t)
        if (t) { return tournamentApi.bracket(t._id) }
        return null
      })
      .then((result) => { if (result) { setBracket(result.bracket) } })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const isCompleted = tournament?.status === 'COMPLETED'

  return (
    <>
      <Navbar />
      <main className="page champion-page">
        {!isCompleted ? (
          <EmptyState label="The champion will be revealed when the grand final is completed." />
        ) : (
          <>
            <small>CHAMPIONSHIP GRAND FINAL MATCHUP</small>
            <div className="final-line">
              {bracket?.final?.participants.map((p) => <span key={p._id}>{p.user.username}</span>)}
            </div>
            <Crown className="crown" size={72} color="#FFD700" />
            <small>CHAMPION REVEALED</small>
            <h1>{bracket?.champion?.user.username}</h1>
            <p>Code Arena 2026 Champion</p>
            <div className="reward-row" style={{ marginTop: 48 }}>
              <div className="card" style={{ borderColor: '#FFD700' }}>
                <Crown color="#FFD700" size={28} />
                <div><small>CHAMPION</small><strong style={{ color: '#FFD700' }}>{bracket?.champion?.user.username}</strong></div>
              </div>
              <div className="card" style={{ borderColor: '#C0C0C0' }}>
                <small>RUNNER UP</small>
                <strong style={{ color: '#C0C0C0' }}>{bracket?.final?.participants.find((p) => p._id !== bracket?.champion?._id)?.user.username || 'TBD'}</strong>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}
