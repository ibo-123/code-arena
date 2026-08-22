import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Trophy, Users } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { tournamentApi } from '../services/tournamentApi'
import type { Tournament } from '../types'

export const Home = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => setTournament(tournaments[0] || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const stages = [
    { stage: 1, label: 'Group Stage' },
    { stage: 2, label: 'Quarter Final' },
    { stage: 3, label: 'Semi Final' },
    { stage: 4, label: 'Grand Final' },
    { stage: 5, label: 'Champion' },
  ]

  return (
    <>
      <Navbar />
      <main className="home">
        <section className="hero-panel">
          <div>
            <Badge tone="blue">CHAMPIONSHIP SERIES</Badge>
            <h1>CODE ARENA <span>2026</span></h1>
            <p>Competitive programming championship.</p>
            <div className="hero-actions">
              <Link to="/register">
                <Button>Register Now <ArrowRight size={16} /></Button>
              </Link>
              <Link to="/bracket">
                <Button variant="secondary">Explore Bracket</Button>
              </Link>
            </div>
          </div>
          <div className="countdown">
            <small>NEXT ROUND IN</small>
            <div className="timer">
              <b>00<em>Days</em></b>
              <b>00<em>Hours</em></b>
              <b>00<em>Minutes</em></b>
              <b>00<em>Seconds</em></b>
            </div>
            <Badge tone={tournament?.status === 'COMPLETED' ? 'gold' : 'blue'}>
              {tournament?.status || 'REGISTRATION'}
            </Badge>
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <span>TOURNAMENT PATH</span>
            <small>THE ROAD TO THE CROWN</small>
          </div>
          <div className="path">
            {stages.map(({ stage, label }) => (
              <div className="path-step" key={stage}>
                <span>STAGE {stage}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="reward-row">
          <Card>
            <Trophy color="#FFD700" size={32} />
            <div>
              <small>CHAMPION</small>
              <strong>One competitor earns the crown.</strong>
            </div>
          </Card>
          <Card>
            <Users color="#2979FF" size={32} />
            <div>
              <small>FIELD</small>
              <strong>20 elite programmers. One arena.</strong>
            </div>
          </Card>
        </section>
      </main>
    </>
  )
}
