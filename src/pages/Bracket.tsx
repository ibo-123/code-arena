import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { tournamentApi } from '../services/tournamentApi'
import type { Tournament, Bracket as BracketType } from '../types'

export const Bracket = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [bracket, setBracket] = useState<BracketType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tournamentApi.list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null
        setTournament(t)
        if (t) {
          return tournamentApi.bracket(t._id)
        }
        return null
      })
      .then((result) => {
        if (result) {
          setBracket(result.bracket)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const matchCard = (match: BracketType['quarterFinal'][number]) => (
    <Card className="match" key={`${match.matchNumber}`}>
      <small>MATCH {match.matchNumber}</small>
      {match.participants.map((p) => (
        <div
          className={`match-player ${match.winner?._id === p._id ? 'winner' : ''}`}
          key={p._id}
        >
          <span>{p.user.username}</span>
          {match.winner?._id === p._id && <Crown size={14} color="#FFD700" />}
        </div>
      ))}
      <Badge tone={match.status === 'COMPLETED' ? 'green' : match.status === 'LIVE' ? 'red' : 'muted'}>
        {match.status}
      </Badge>
    </Card>
  )

  return (
    <>
      <Navbar />
      <main className="page public-page">
        <header className="page-heading">
          <div>
            <small>CODE ARENA 2026</small>
            <h1>Championship Bracket</h1>
          </div>
          <Badge tone={tournament?.status === 'COMPLETED' ? 'gold' : 'blue'}>
            {tournament?.status || 'REGISTRATION'}
          </Badge>
        </header>

        <div className="bracket-scroll">
          <section className="bracket-column groups">
            <h3>GROUP STAGE</h3>
            {bracket?.groupStage ? (
              Object.entries(bracket.groupStage).map(([group, players]) => (
                <Card key={group}>
                  <small>GROUP {group}</small>
                  {players.length ? (
                    players.map((p) => (
                      <div className="match-player" key={p._id}>
                        <span>#{p.seed} {p.user.username}</span>
                        <Badge tone={p.status === 'ELIMINATED' ? 'muted' : 'green'}>
                          {p.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p>Awaiting draw</p>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState label="Groups not yet drawn" />
            )}
          </section>

          <section className="bracket-column">
            <h3>QUARTER FINALS</h3>
            {bracket?.quarterFinal?.length ? (
              bracket.quarterFinal.map(matchCard)
            ) : (
              <EmptyState label="Quarter finals pending" />
            )}
          </section>

          <section className="bracket-column">
            <h3>SEMIFINALS</h3>
            {bracket?.semiFinal?.length ? (
              bracket.semiFinal.map(matchCard)
            ) : (
              <EmptyState label="Semifinals pending" />
            )}
          </section>

          <section className="bracket-column">
            <h3>GRAND FINAL</h3>
            {bracket?.final ? (
              matchCard(bracket.final)
            ) : (
              <EmptyState label="Finalists pending" />
            )}
            <Card className="champion-card">
              <Crown color="#FFD700" size={32} />
              <small>CHAMPION</small>
              <strong>{bracket?.champion?.user.username || 'To be crowned'}</strong>
            </Card>
          </section>
        </div>
      </main>
    </>
  )
}
