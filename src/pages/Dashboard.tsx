import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { Tournament, Participant } from '../types'

export const Dashboard = () => {
  const { user } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null
        setTournament(t)
        if (t) {
          return tournamentApi.participants(t._id)
        }
        return null
      })
      .then((result) => {
        if (result) {
          const p = result.participants.find((p) => p.user._id === user?._id)
          setParticipant(p || null)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <>
      <Navbar />
      <main className="page">
        <header className="page-heading">
          <div>
            <small>PARTICIPANT DASHBOARD</small>
            <h1>Welcome back, {user?.username}</h1>
            <p>
              <CheckCircle2 size={15} color="#00E676" />
              Codeforces Synced
            </p>
          </div>
          <Badge tone={tournament?.status === 'COMPLETED' ? 'gold' : 'blue'}>
            {tournament?.currentRound || 'Registration'}
          </Badge>
        </header>

        <div className="stat-grid">
          <Card>
            <small>Current Rank</small>
            <strong className="stat-value">#{participant?.rank || '—'}</strong>
          </Card>
          <Card>
            <small>Score</small>
            <strong className="stat-value">{participant?.score || 0} pts</strong>
          </Card>
          <Card>
            <small>Penalty</small>
            <strong className="stat-value">{participant?.penalty || 0}</strong>
          </Card>
        </div>

        <div className="two-col">
          <Card>
            <small>NEXT MATCH STATUS</small>
            <h2>{tournament?.status === 'REGISTRATION' ? 'Registration is open' : tournament?.currentRound}</h2>
            <p>Check the live contest and bracket for the official state.</p>
            <Link to="/live">
              Open Live Contest <ArrowRight size={15} />
            </Link>
          </Card>
          <Card>
            <small>RECENT CONTEST LOGS</small>
            {participant ? (
              <p>
                Rank #{participant.rank || '—'} · {participant.solved} solved · {participant.score} pts
              </p>
            ) : (
              <EmptyState label="No contest results yet." />
            )}
          </Card>
        </div>
      </main>
    </>
  )
}
