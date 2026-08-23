import { useEffect, useState } from 'react'
import { 
  Badge, 
  Card, 
  EmptyState, 
  ErrorState, 
  LoadingState 
} from '../../components/ui'
import { 
  Users, 
  RefreshCw,
  Star
} from 'lucide-react'
import { tournamentApi } from '../../services/tournamentApi'
import type { Participant } from '../../types'

export const AdminGroups = () => {
  const [groups, setGroups] = useState<Record<string, Participant[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const fetchGroups = async () => {
    try {
      const { tournaments } = await tournamentApi.list()
      const t = tournaments[0]
      if (!t) return { groups: {} }
      const { groups: map } = await tournamentApi.groups(t._id)
      setGroups(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    }
  }

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchGroups()
      .catch((err) => { if (isMounted) setError(err.message) })
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGroups()
    setRefreshing(false)
  }

  if (loading) return <LoadingState label="Loading group seeding..." />
  if (error) return <ErrorState error={error} />

  const groupKeys = Object.keys(groups).length ? Object.keys(groups).sort() : ['A', 'B', 'C', 'D']
  const allParticipants = Object.values(groups).flat()
  const totalParticipants = allParticipants.length
  const groupsWithParticipants = groupKeys.filter(key => (groups[key] || []).length > 0)
  const activeGroupsCount = groupsWithParticipants.length

  const groupStats = groupKeys.map(key => {
    const players = groups[key] || []
    const active = players.filter(p => p.status !== 'ELIMINATED').length
    const avgSeed = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (p.seed || 0), 0) / players.length) : 0
    return { key, count: players.length, active, avgSeed }
  })

  return (
    <div style={{ padding: '24px 0' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <small style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Group Stage Allocation
          </small>
          <h1 style={{
            fontSize: 'clamp(24px, 2.5vw, 36px)',
            fontWeight: '700',
            margin: '4px 0 0 0'
          }}>
            Groups & Seeding
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '4px'
          }}>
            {totalParticipants} participants across {activeGroupsCount} groups
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Badge tone="green">
            {activeGroupsCount} Groups
          </Badge>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshCw size={16} style={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none' 
            }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {groupStats.map(({ key, count, active, avgSeed }) => (
          <div key={key} style={{
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            ...(selectedGroup === key ? {
              borderColor: '#4CAF50',
              background: 'rgba(76, 175, 80, 0.05)'
            } : {})
          }}
          onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'white'
              }}>
                Group {key}
              </span>
              <Badge tone={active === count ? 'green' : 'muted'}>
                {active}/{count}
              </Badge>
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)'
            }}>
              {count} participants · Avg seed {avgSeed}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {groupKeys.map((groupKey) => {
          const players = groups[groupKey] || []
          const isActive = players.some(p => p.status !== 'ELIMINATED')
          const topSeeds = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999)).slice(0, 2)

          return (
            <Card
              key={groupKey}
              style={{
                padding: '0',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedGroup === groupKey ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                ...(selectedGroup === groupKey ? {
                  transform: 'scale(1.02)',
                  boxShadow: '0 8px 30px rgba(76, 175, 80, 0.1)'
                } : {})
              }}
            >
              <div style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getGroupColor(groupKey)}, ${getGroupColor(groupKey)}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: 'white'
                  }}>
                    {groupKey}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      Group {groupKey}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      {players.length} participants · {isActive ? 'Active' : 'Completed'}
                    </div>
                  </div>
                </div>

                {topSeeds.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    {topSeeds.map((p) => (
                      <div
                        key={p._id}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255,215,0,0.1)',
                          border: '1px solid rgba(255,215,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#FFD700'
                        }}
                      >
                        #{p.seed}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 20px'
              }}>
                {players.length ? (
                  <div style={{
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {players
                      .sort((a, b) => (a.seed || 999) - (b.seed || 999))
                      .map((p) => {
                        const isEliminated = p.status === 'ELIMINATED'
                        const isTopSeed = p.seed && p.seed <= 2
                        
                        return (
                          <div
                            key={p._id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isEliminated 
                                ? 'rgba(255,255,255,0.02)' 
                                : isTopSeed
                                ? 'rgba(255,215,0,0.05)'
                                : 'rgba(255,255,255,0.02)',
                              border: isTopSeed && !isEliminated
                                ? '1px solid rgba(255,215,0,0.1)'
                                : '1px solid transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isEliminated 
                                  ? 'rgba(255,255,255,0.05)'
                                  : isTopSeed
                                  ? 'rgba(255,215,0,0.1)'
                                  : 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: isEliminated 
                                  ? 'rgba(255,255,255,0.3)'
                                  : isTopSeed
                                  ? '#FFD700'
                                  : 'rgba(255,255,255,0.5)'
                              }}>
                                #{p.seed || '—'}
                              </div>
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: isTopSeed && !isEliminated ? '600' : '400',
                                  color: isEliminated 
                                    ? 'rgba(255,255,255,0.3)' 
                                    : 'white'
                                }}>
                                  {p.user?.name || p.user?.username || 'Unknown'}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: 'rgba(255,255,255,0.3)'
                                }}>
                                  @{p.user?.username || 'unknown'}
                                </div>
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              {isTopSeed && !isEliminated && (
                                <Star size={14} color="#FFD700" />
                              )}
                              <Badge tone={isEliminated ? 'muted' : 'green'}>
                                {p.status || 'Active'}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <EmptyState label={`Group ${groupKey} pending draw.`} />
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const getGroupColor = (groupKey: string): string => {
  const colors: Record<string, string> = {
    'A': '#4CAF50',
    'B': '#2979FF',
    'C': '#FF9800',
    'D': '#9C27B0',
    'E': '#E91E63',
    'F': '#00BCD4',
    'G': '#FF5722',
    'H': '#795548'
  }
  return colors[groupKey] || '#607D8B'
}

export default AdminGroups