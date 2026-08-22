import { api } from './api'
import type { AuditLog, ApiResponse } from '../types'

export const adminApi = {
  getLogs: (tournamentId: string) =>
    api.get<{ logs: AuditLog[] }>(`/admin/tournaments/${tournamentId}/logs`),

  syncCodeforces: (tournamentId: string) =>
    api.post<ApiResponse>(`/admin/tournaments/${tournamentId}/sync-codeforces`),

  getSystemStatus: () =>
    api.get<{ status: string; apiResponse: string }>('/admin/status'),
}
