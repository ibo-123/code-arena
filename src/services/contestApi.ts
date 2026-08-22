import { api } from './api'
import type { Contest, ContestResult, LeaderboardEntry, ApiResponse } from '../types'

export const contestApi = {
  list: (tournamentId: string) =>
    api.get<{ contests: Contest[] }>(`/tournaments/${tournamentId}/contests`),

  get: (tournamentId: string, contestId: string) =>
    api.get<{ contest: Contest }>(`/tournaments/${tournamentId}/contests/${contestId}`),

  leaderboard: (tournamentId: string, contestId: string) =>
    api.get<{ leaderboard: LeaderboardEntry[] }>(
      `/tournaments/${tournamentId}/contests/${contestId}/leaderboard`
    ),

  results: (tournamentId: string, contestId: string) =>
    api.get<{ results: ContestResult[] }>(
      `/tournaments/${tournamentId}/contests/${contestId}/results`
    ),

  create: (tournamentId: string, data: Partial<Contest>) =>
    api.post<{ contest: Contest }>(`/admin/tournaments/${tournamentId}/contests`, data),

  sync: (tournamentId: string, contestId: string) =>
    api.post<{ results: ContestResult[]; unmatchedHandles: string[] }>(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/sync`
    ),
}
