import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, contestApi } from '../services/api';
import type { AuditLog } from '../services/adminApi';
import type { Contest, Tournament } from '../types';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from './ui';
import { 
  Plus, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Calendar,
  Hash,
  Trophy,
  Filter
} from 'lucide-react';

const formatDate = (value?: string | Date) => 
  value ? new Date(value).toLocaleString([], { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }) : '—';

const getStatusTone = (status?: string): 'blue' | 'gold' | 'green' | 'red' | 'muted' => {
  if (status === 'LIVE') return 'red';
  if (status === 'FINISHED') return 'green';
  if (status === 'UPCOMING') return 'blue';
  return 'muted';
};

const getStatusIcon = (status?: string) => {
  if (status === 'LIVE') return <Clock size={14} />;
  if (status === 'FINISHED') return <CheckCircle size={14} />;
  if (status === 'UPCOMING') return <Calendar size={14} />;
  return <AlertCircle size={14} />;
};

const ROUND_OPTIONS = [
  { value: 'GROUP_STAGE', label: 'Group Stage' },
  { value: 'QUARTER_FINAL', label: 'Quarter Final' },
  { value: 'SEMI_FINAL', label: 'Semi Final' },
  { value: 'FINAL', label: 'Grand Final' },
];

const GROUP_OPTIONS = ['A', 'B', 'C', 'D'];

export const AdminContests = ({ tournament }: { tournament: Tournament }) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRound, setSelectedRound] = useState('GROUP_STAGE');

  const refreshContests = () => {
    contestApi.list(tournament._id)
      .then(({ contests: rows }) => setContests(rows))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    let isMounted = true;
    contestApi.list(tournament._id)
      .then(({ contests: rows }) => { if (isMounted) setContests(rows); })
      .catch((err: Error) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [tournament._id]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const round = String(form.get('round'));
    const matchNumber = form.get('matchNumber');
    
    setBusy(true);
    setError('');
    setNotice('');
    
    try {
      await contestApi.create(tournament._id, {
        name: String(form.get('name')),
        round,
        group: round === 'GROUP_STAGE' ? String(form.get('group')) : undefined,
        matchNumber: round === 'GROUP_STAGE' ? undefined : Number(matchNumber),
        codeforcesContestId: Number(form.get('codeforcesContestId')),
        codeforcesUrl: String(form.get('codeforcesUrl')),
        startTime: String(form.get('startTime')),
        durationMinutes: Number(form.get('durationMinutes')),
      });
      event.currentTarget.reset();
      setNotice('Contest attached successfully.');
      setShowForm(false);
      refreshContests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach contest');
    } finally {
      setBusy(false);
    }
  };

  const sync = async (contest: Contest) => {
    setBusy(true);
    setError('');
    try {
      const result = await contestApi.sync(tournament._id, contest._id);
      setNotice(`Synchronized ${result.results?.length || 0} results; ${result.unmatchedHandles?.length || 0} unmatched handles.`);
      refreshContests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize results');
    } finally {
      setBusy(false);
    }
  };

  // Calculate stats
  const totalContests = contests.length;
  const liveContests = contests.filter(c => c.status === 'LIVE').length;
  const upcomingContests = contests.filter(c => c.status === 'UPCOMING').length;
  const finishedContests = contests.filter(c => c.status === 'FINISHED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        {[
          { label: 'Total Contests', value: totalContests, icon: Trophy, color: '#2979FF' },
          { label: 'Live', value: liveContests, icon: Clock, color: '#FF6B6B' },
          { label: 'Upcoming', value: upcomingContests, icon: Calendar, color: '#FFD700' },
          { label: 'Finished', value: finishedContests, icon: CheckCircle, color: '#4CAF50' },
        ].map((stat) => (
          <Card key={stat.label} style={{
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${stat.color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'white'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {stat.label}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Card */}
      <Card style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showForm ? '20px' : '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Plus size={20} color="#2979FF" />
            <small style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Attach Codeforces Contest
            </small>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #2979FF, #1565C0)',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {showForm ? 'Cancel' : 'Add Contest'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <input
              required
              name="name"
              placeholder="Contest Name"
              style={inputStyle}
            />
            
            <select
              required
              name="round"
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              style={selectStyle}
            >
              {ROUND_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            {selectedRound === 'GROUP_STAGE' && (
              <select
                name="group"
                defaultValue="A"
                style={selectStyle}
              >
                {GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group}>Group {group}</option>
                ))}
              </select>
            )}
            
            {selectedRound !== 'GROUP_STAGE' && (
              <input
                required
                min="1"
                name="matchNumber"
                type="number"
                placeholder="Match number"
                style={inputStyle}
              />
            )}
            
            <input
              required
              min="1"
              name="codeforcesContestId"
              type="number"
              placeholder="Codeforces ID"
              style={inputStyle}
            />
            
            <input
              required
              name="codeforcesUrl"
              type="url"
              placeholder="Codeforces URL"
              style={inputStyle}
            />
            
            <input
              required
              name="startTime"
              type="datetime-local"
              style={inputStyle}
            />
            
            <input
              required
              min="1"
              name="durationMinutes"
              type="number"
              placeholder="Duration (minutes)"
              style={inputStyle}
            />
            
            <button
              disabled={busy}
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: busy ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #4CAF50, #388E3C)',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                gridColumn: '1 / -1'
              }}
            >
              {busy ? 'Attaching...' : 'Attach Contest'}
            </button>
          </form>
        )}

        {error && <ErrorState error={error} />}
        {notice && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            color: '#4CAF50',
            fontSize: '14px'
          }}>
            {notice}
          </div>
        )}
      </Card>

      {/* Contests Table */}
      <Card style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Filter size={18} color="rgba(255,255,255,0.4)" />
            <small style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Attached Contests ({contests.length})
            </small>
          </div>
          <button
            onClick={refreshContests}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshCw size={14} style={{ 
              animation: loading ? 'spin 1s linear infinite' : 'none' 
            }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading contests..." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {contests.length ? (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <th style={thStyle}>Contest</th>
                    <th style={thStyle}>Round</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Last Synced</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contests.map((contest) => (
                    <tr key={contest._id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.2s ease'
                    }}>
                      <td style={tdStyle}>
                        <div>
                          <strong style={{ color: 'white' }}>{contest.codeforcesContestName || contest.name}</strong>
                          {contest.codeforcesUrl && (
                            <a
                              href={contest.codeforcesUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginLeft: '8px',
                                color: '#2979FF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.3)'
                        }}>
                          <Hash size={12} style={{ display: 'inline', marginRight: '2px' }} />
                          CF {contest.codeforcesContestId}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {contest.group 
                          ? `Group ${contest.group}` 
                          : `${contest.stage} ${contest.matchNumber ? `M${contest.matchNumber}` : ''}`
                        }
                      </td>
                      <td style={tdStyle}>
                        <Badge tone={getStatusTone(contest.status)}>
                          {getStatusIcon(contest.status)}
                          {contest.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td style={{
                        ...tdStyle,
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '13px'
                      }}>
                        {formatDate(contest.lastSyncedAt)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          disabled={busy}
                          onClick={() => sync(contest)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            background: 'rgba(41,121,255,0.15)',
                            border: '1px solid rgba(41,121,255,0.2)',
                            color: '#2979FF',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: busy ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <RefreshCw size={14} style={{ 
                            marginRight: '6px',
                            animation: busy ? 'spin 1s linear infinite' : 'none'
                          }} />
                          Sync Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState label="No contests attached yet." />
            )}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Styles
const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.3s ease'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: '500'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: 'rgba(255,255,255,0.8)',
  verticalAlign: 'middle'
};

// AdminLogs component
export const AdminLogs = ({ tournamentId }: { tournamentId: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    adminApi.logs({ tournamentId })
      .then(({ logs: rows }) => { if (isMounted) setLogs(rows || []); })
      .catch((err: Error) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [tournamentId]);

  const actionTypes = ['all', ...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesAction = filter === 'all' || log.action === filter;
    const matchesSearch = log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.admin?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  if (loading) return <LoadingState label="Loading system logs..." />;
  if (error) return <ErrorState error={error} />;
  if (!logs.length) return <EmptyState label="No recorded admin actions yet." />;

  return (
    <Card style={{
      padding: '0',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={18} color="rgba(255,255,255,0.4)" />
          <small style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            System Logs ({filteredLogs.length})
          </small>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '6px 12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                width: '120px'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
                padding: '4px 4px'
              }}
            >
              {actionTypes.map((action) => (
                <option key={action} value={action} style={{ background: '#1a1f35' }}>
                  {action === 'all' ? 'All Actions' : action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr 
                key={log._id || index} 
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  transition: 'background 0.2s ease'
                }}
              >
                <td style={{
                  ...tdStyle,
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}>
                  {formatDate(log.createdAt)}
                </td>
                <td style={tdStyle}>
                  <Badge tone="muted">
                    {log.action}
                  </Badge>
                </td>
                <td style={{
                  ...tdStyle,
                  color: 'white',
                  fontWeight: '500'
                }}>
                  {log.admin?.username || log.admin?.name || '—'}
                </td>
                <td style={{
                  ...tdStyle,
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {log.description || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
