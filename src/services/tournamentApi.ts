import { api } from './api'
import type { Tournament, Participant, Bracket, LeaderboardEntry, ApiResponse } from '../types'

export const tournamentApi = {
  list: () =>
    api.get<{ tournaments: Tournament[] }>('/tournaments'),

  get: (id: string) =>
    api.get<{ tournament: Tournament }>(`/tournaments/${id}`),

  participants: (tournamentId: string) =>
    api.get<{ participants: Participant[] }>(`/tournaments/${tournamentId}/participants`),

  groups: (tournamentId: string) =>
    api.get<{ groups: Record<string, Participant[]> }>(`/tournaments/${tournamentId}/groups`),

  leaderboard: (tournamentId: string) =>
    api.get<{ leaderboard: LeaderboardEntry[] }>(`/tournaments/${tournamentId}/leaderboard`),

  bracket: (tournamentId: string) =>
    api.get<{ bracket: Bracket }>(`/tournaments/${tournamentId}/bracket`),

  start: (tournamentId: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/start`),

  advance: (tournamentId: string, round: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/advance`, { round }),

  drawGroups: (tournamentId: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/draw-groups`),

  complete: (tournamentId: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/complete`),

  sync: (tournamentId: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/sync`),
}
