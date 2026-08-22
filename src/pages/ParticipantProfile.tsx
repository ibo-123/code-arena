import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { Participant } from '../types'

export const ParticipantProfile = () => {
  const { participantId } = useParams()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0]
        if (t) { return tournamentApi.participants(t._id) }
        return null
      })
      .then((result) => { if (result) { const p = result.participants.find((p) => p._id === participantId); setParticipant(p || null) } })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [participantId])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!participant) return <EmptyState label="Participant not found." />

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <Card className="profile-card">
          <div className="avatar large">{participant.user.username.slice(0, 1).toUpperCase()}</div>
          <div>
            <Badge tone={participant.status === 'CHAMPION' ? 'gold' : 'blue'}>{participant.status || 'PARTICIPANT'}</Badge>
            <h1>{participant.user.username}</h1>
            <p>Codeforces handle: <strong>{participant.user.codeforcesUsername}</strong></p>
            <p>Group {participant.group || 'TBA'} · {participant.currentRound}</p>
          </div>
        </Card>
        <div className="stat-grid">
          <Card><small>Total Score</small><strong className="stat-value">{participant.score}</strong></Card>
          <Card><small>Problems Solved</small><strong className="stat-value">{participant.solved}</strong></Card>
          <Card><small>Best Rank</small><strong className="stat-value">#{participant.rank || '—'}</strong></Card>
        </div>
        <Card>
          <small>TOURNAMENT PROGRESS</small>
          <div className="path" style={{ marginTop: 16 }}>
            {['GROUP A', 'QUARTERS', 'SEMIS', 'FINAL'].map((stage) => (
              <div className="path-step" key={stage}><span>{stage}</span><strong>•</strong></div>
            ))}
          </div>
        </Card>
        <Card><small>MATCH HISTORY</small><EmptyState label="No match history available." /></Card>
        <Card><small>ACHIEVEMENTS</small><EmptyState label="No verified achievements available yet." /></Card>
      </main>
    </>
  )
}
