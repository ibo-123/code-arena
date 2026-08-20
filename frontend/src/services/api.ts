import type { Contest, LeaderboardEntry, Participant, Result, Tournament, User } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('code-arena-token')
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
  return body as T
}

export const authApi = {
  login: (email: string, password: string) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: { name: string; username: string; email: string; password: string; codeforcesUsername: string }) => request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<{ user: User }>('/auth/me'),
}
export const tournamentApi = {
  list: () => request<{ tournaments: Tournament[] }>('/tournaments'),
  get: (id: string) => request<{ tournament: Tournament }>(`/tournaments/${id}`),
  participants: (id: string) => request<{ participants: Participant[] }>(`/tournaments/${id}/participants`),
  groups: (id: string) => request<{ groups: Record<string, Participant[]> }>(`/tournaments/${id}/groups`),
  bracket: (id: string) => request<{ bracket: Bracket }>(`/tournaments/${id}/bracket`),
  leaderboard: (id: string) => request<{ leaderboard: TournamentEntry[] }>(`/tournaments/${id}/leaderboard`),
  join: (id: string) => request(`/tournaments/${id}/join`, { method: 'POST' }),
  start: (id: string) => request(`/tournaments/${id}/start`, { method: 'POST' }),
  advance: (id: string, stage: 'group-stage' | 'quarter-final' | 'semi-final' | 'complete') => request(`/tournaments/${id}/${stage === 'complete' ? 'complete' : `advance/${stage}`}`, { method: 'POST' }),
}
export const contestApi = {
  list: (id: string) => request<{ contests: Contest[] }>(`/tournaments/${id}/contests`),
  leaderboard: (tournamentId: string, contestId: string) => request<{ contest: Contest; leaderboard: LeaderboardEntry[]; lastSyncedAt: string }>(`/tournaments/${tournamentId}/contests/${contestId}/leaderboard`),
  results: (tournamentId: string, contestId: string) => request<{ results: Result[] }>(`/tournaments/${tournamentId}/contests/${contestId}/results`),
  sync: (tournamentId: string, contestId: string) => request<{ results: Result[]; unmatchedHandles: string[] }>(`/tournaments/${tournamentId}/contests/${contestId}/sync`, { method: 'POST' }),
  create: (tournamentId: string, contest: Partial<Contest>) => request<{ contest: Contest }>(`/tournaments/${tournamentId}/contests`, { method: 'POST', body: JSON.stringify(contest) }),
}
export interface AuditLog { _id: string; action: string; description: string; createdAt: string; admin?: Pick<User, 'name' | 'username'>; tournament?: string; metadata?: Record<string, unknown> }
export const adminApi = {
  logs: (tournamentId?: string) => request<{ logs: AuditLog[] }>(`/admin/logs${tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''}`),
}
export interface Match { matchNumber: number; participants: Participant[]; contest?: Contest; winner?: Participant }
export interface Bracket { groupStage: Record<string, Participant[]>; quarterFinal: Match[]; semiFinal: Match[]; final: Match | null; champion: Participant | null }
export interface TournamentEntry { participant: Participant; group?: string; groupRank?: number; currentRound: string; status: string; latestRank: number | null; solved: number; score: number; penalty: number; winRate?: number | null }
