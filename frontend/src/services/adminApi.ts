import apiClient from './api';
import type { AuditLog, Tournament, Participant } from '../types';

// ============================================
// ADMIN API TYPES
// ============================================

export interface AdminStats {
  totalTournaments: number;
  totalParticipants: number;
  activeTournaments: number;
  completedTournaments: number;
  recentActivity: AuditLog[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T;
  logs?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    availableActions: string[];
  };
}

export interface TournamentCreateResponse {
  success: boolean;
  message: string;
  tournament: Tournament;
}

// ============================================
// ADMIN API
// ============================================

export const adminApi = {
  /**
   * GET /api/admin/audit-logs
   * Get audit logs with filtering and pagination
   * @param params - Query parameters
   */
  async logs(params?: {
    tournamentId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditLog>> {
    const queryParams = new URLSearchParams();
    if (params?.tournamentId) queryParams.append('tournamentId', params.tournamentId);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const url = `/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * GET /api/admin/health
   * Admin health check
   */
  async health(): Promise<{ success: boolean; message: string; timestamp: string; admin: string }> {
    const response = await apiClient.get('/admin/health');
    return response.data;
  },

  // ============================================
  // TOURNAMENT MANAGEMENT
  // ============================================

  /**
   * POST /api/admin/tournaments
   * Create a new tournament
   */
  async createTournament(data: any): Promise<TournamentCreateResponse> {
    const response = await apiClient.post('/admin/tournaments', data);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/start
   * Start tournament and generate groups
   */
  async startTournament(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/start`);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/advance
   * Advance tournament to the next stage
   * @param stage - 'group-stage' | 'qf' | 'sf' | 'complete'
   */
  async advanceTournament(tournamentId: string, stage: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance`, { stage });
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/advance/group-stage
   * Advance group stage to quarter finals
   */
  async advanceGroupStage(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance/group-stage`);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/advance/qf
   * Advance quarter finals to semi finals
   */
  async advanceQuarterFinal(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance/qf`);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/advance/sf
   * Advance semi finals to final
   */
  async advanceSemiFinal(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance/sf`);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/advance/complete
   * Complete tournament and crown champion
   */
  async completeTournament(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance/complete`);
    return response.data;
  },

  // ============================================
  // CONTEST MANAGEMENT
  // ============================================

  /**
   * POST /api/admin/tournaments/:tournamentId/contests/validate/:contestId
   * Validate a Codeforces contest
   */
  async validateContest(tournamentId: string, contestId: string | number): Promise<any> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/validate/${contestId}`
    );
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/contests
   * Publish a contest to a tournament
   */
  async publishContest(
    tournamentId: string,
    data: {
      codeforcesContestId: number;
      stage: string;
      group?: string;
      matchNumber?: number;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests`, data);
    return response.data;
  },

  /**
   * GET /api/admin/tournaments/:tournamentId/contests
   * Get all contests for a tournament
   */
  async getContests(tournamentId: string): Promise<any> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  /**
   * POST /api/admin/tournaments/:tournamentId/contests/:contestId/sync
   * Sync results for a contest
   */
  async syncContestResults(tournamentId: string, contestId: string): Promise<any> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/sync`
    );
    return response.data;
  },

  /**
   * GET /api/admin/tournaments/:tournamentId/contests/:contestId/leaderboard
   * Get leaderboard for a specific contest
   */
  async getContestLeaderboard(tournamentId: string, contestId: string): Promise<any> {
    const response = await apiClient.get(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/leaderboard`
    );
    return response.data;
  },

  // ============================================
  // PARTICIPANT MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/tournaments/:tournamentId/participants
   * Get all participants for a tournament
   */
  async getParticipants(tournamentId: string): Promise<{ success: boolean; count: number; participants: Participant[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/participants`);
    return response.data;
  },

  /**
   * GET /api/admin/tournaments/:tournamentId/groups
   * Get groups for a tournament
   */
  async getGroups(tournamentId: string): Promise<any> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/groups`);
    return response.data;
  },

  // ============================================
  // STATS & DASHBOARD
  // ============================================

  /**
   * GET /api/admin/dashboard/stats
   * Get dashboard statistics (if endpoint exists)
   */
  async dashboardStats(): Promise<AdminStats> {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      // Fallback: return default stats if endpoint doesn't exist yet
      console.warn('Dashboard stats endpoint not available, using fallback');
      return {
        totalTournaments: 0,
        totalParticipants: 0,
        activeTournaments: 0,
        completedTournaments: 0,
        recentActivity: [],
      };
    }
  },
};

// Export types for components
export type { AuditLog };