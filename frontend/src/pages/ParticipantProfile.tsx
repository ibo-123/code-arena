import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { tournamentApi } from '../services/tournamentApi'
import type { Participant } from '../types'

export const ParticipantProfile = () => {
  const { participantId } = useParams<{ participantId: string }>()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!participantId) return
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (!t) throw new Error('No tournament found')
        return tournamentApi.participants(t._id)
      })
      .then(({ participants }) => {
        const p = participants.find((item) => item._id === participantId || item.user._id === participantId)
        setParticipant(p || null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [participantId])

  if (loading) return <LoadingState label="Loading participant profile..." />
  if (error) return <ErrorState error={error} />
  if (!participant) return <EmptyState label="Participant profile not found." />

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <div style={{ marginBottom: 16 }}>
          <Link to="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sub)' }}>
            <ArrowLeft size={16} /> Back to Leaderboard
          </Link>
        </div>

        <Card className="profile-card" style={{ marginBottom: 24, padding: 32 }}>
          <div className="avatar large">
            {participant.user.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <Badge tone={participant.status === 'ELIMINATED' ? 'muted' : participant.status === 'CHAMPION' ? 'gold' : 'green'}>
              {participant.status}
            </Badge>
            <h1 style={{ margin: '8px 0 4px', fontSize: 32 }}>{participant.user.name}</h1>
            <p style={{ color: 'var(--sub)', margin: 0 }}>@{participant.user.username}</p>
            {participant.user.codeforcesUsername && (
              <a
                href={`https://codeforces.com/profile/${participant.user.codeforcesUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--blue)', marginTop: 8, fontSize: 13 }}
              >
                Codeforces: {participant.user.codeforcesUsername} <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Card>

        <div className="stat-grid">
          <Card>
            <small>Group Assignment</small>
            <strong className="stat-value">{participant.group ? `Group ${participant.group}` : 'Unassigned'}</strong>
          </Card>
          <Card>
            <small>Seed Number</small>
            <strong className="stat-value">#{participant.seed || '—'}</strong>
          </Card>
          <Card>
            <small>Current Round</small>
            <strong className="stat-value">{participant.currentRound || 'Group Stage'}</strong>
          </Card>
        </div>

        <div className="two-col" style={{ marginTop: 16 }}>
          <Card>
            <small>CHAMPIONSHIP SCORE</small>
            <strong className="stat-value" style={{ color: 'var(--purple)' }}>{participant.score || 0} pts</strong>
          </Card>
          <Card>
            <small>PROBLEMS SOLVED</small>
            <strong className="stat-value">{participant.solved || 0}</strong>
          </Card>
        </div>
      </main>
    </>
  )
}

export default ParticipantProfile
