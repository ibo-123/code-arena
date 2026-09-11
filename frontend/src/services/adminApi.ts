import { apiClient } from './api';
import type {
  AuditLog,
  Tournament,
  Participant,
  Bracket,
  Result,
  VideoSubmission,
  Invitation,
} from '../types';

export interface AdminActionResponse {
  success: boolean;
  message: string;
}

export interface ValidateContestResponse {
  success: boolean;
  contest?: {
    id: number;
    name: string;
    phase: string;
    startTimeSeconds?: number;
    durationSeconds?: number;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
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

export interface AdminStats {
  success: boolean;
  stats: {
    totalTournaments: number;
    activeTournaments: number;
    completedTournaments: number;
    totalParticipants: number;
    qualifiedParticipants: number;
    totalContests: number;
    activeContests: number;
    completedContests: number;
    upcomingMatches: number;
    recentActivity: AuditLog[];
  };
}

/**
 * V1 Contest payload — matches the backend `createContest` / `updateContest`.
 * No Codeforces API is used; admin enters the invitation URL manually.
 */
export interface ContestPayload {
  name: string;
  invitationUrl: string;
  stage: 'QUALIFICATION' | 'GROUP_STAGE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
  group?: string;
  startTime: string;      // ISO date-time string
  endTime?: string;       // ISO date-time string
  durationMinutes?: number;
  description?: string;
  matchNumber?: number;
}

export interface AdminContest {
  _id: string;
  tournamentId: string;
  name: string;
  invitationUrl: string;
  description?: string;
  stage: string;
  group?: string | null;
  matchNumber?: number | null;
  startTime: string | null;
  endTime: string | null;
  durationSeconds?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  published: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminApi = {
  // ---------- AUDIT LOGS ----------
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

  async health(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.get('/admin/health');
    return response.data;
  },

  // ---------- TOURNAMENTS ----------
  async createTournament(
    data: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; tournament: Tournament }> {
    const response = await apiClient.post('/admin/tournaments', data);
    return response.data;
  },

  async updateTournament(
    tournamentId: string,
    data: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; tournament: Tournament }> {
    const response = await apiClient.patch(`/admin/tournaments/${tournamentId}`, data);
    return response.data;
  },

  async startTournament(tournamentId: string): Promise<AdminActionResponse> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/start`);
    return response.data;
  },

  async advanceTournament(tournamentId: string, stage: string): Promise<AdminActionResponse> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance`, { stage });
    return response.data;
  },

  // ---------- PARTICIPANTS ----------
  async getParticipants(
    tournamentId: string,
  ): Promise<{ participants: Participant[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/participants`);
    return response.data;
  },

  async getGroups(
    tournamentId: string,
  ): Promise<{ groups: Record<string, Participant[]>; groupCount: number; totalParticipants: number }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/groups`);
    return response.data;
  },

  async approveParticipant(
    tournamentId: string,
    participantId: string,
  ): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(
      `/admin/tournaments/${tournamentId}/participants/${participantId}/approve`,
    );
    return response.data;
  },

  async rejectParticipant(
    tournamentId: string,
    participantId: string,
  ): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(
      `/admin/tournaments/${tournamentId}/participants/${participantId}/reject`,
    );
    return response.data;
  },

  async updateParticipant(
    tournamentId: string,
    participantId: string,
    data: Partial<Participant>,
  ): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(
      `/admin/tournaments/${tournamentId}/participants/${participantId}`,
      data,
    );
    return response.data;
  },

  // ---------- STANDINGS ----------
  async getStandings(
    tournamentId: string,
  ): Promise<{
    success: boolean;
    tournament?: { id: string; name: string; status: string; currentStage: string };
    count?: number;
    leaderboard: any[];
  }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/standings`);
    return response.data;
  },

  async getGroupStandings(
    tournamentId: string,
    groupId: string,
  ): Promise<{ standings: any[]; group: string; tournamentName: string }> {
    const response = await apiClient.get(
      `/admin/tournaments/${tournamentId}/groups/${groupId}/standings`,
    );
    return response.data;
  },

  // ---------- BRACKET / MATCHES ----------
  async getBracket(tournamentId: string): Promise<{ bracket: Bracket }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/bracket`);
    return response.data;
  },

  async getMatches(
    tournamentId: string,
    stage?: string,
  ): Promise<{ matches: any[]; count: number }> {
    const params = stage ? `?stage=${stage}` : '';
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/matches${params}`);
    return response.data;
  },

  async setMatchWinner(matchId: string, winnerId: string): Promise<{ match: any; nextMatch?: any }> {
    const response = await apiClient.patch(`/admin/matches/${matchId}/winner`, { winnerId });
    return response.data;
  },

  // ---------- VIDEO SUBMISSIONS ----------
  async getVideoSubmissions(
    contestId: string,
    status?: string,
  ): Promise<{ submissions: VideoSubmission[]; count: number }> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(
      `/admin/contests/${contestId}/video-submissions${params}`,
    );
    return response.data;
  },

  async approveVideo(submissionId: string): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(`/admin/video-submissions/${submissionId}/approve`);
    return response.data;
  },

  async rejectVideo(
    submissionId: string,
    reason?: string,
  ): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(
      `/admin/video-submissions/${submissionId}/reject`,
      { reason },
    );
    return response.data;
  },

  // ---------- V1 CONTESTS (manual invitations — no Codeforces API) ----------
  /**
   * GET /admin/tournaments/:tournamentId/contests
   * List all contests for a tournament (includes drafts).
   */
  async getContests(
    tournamentId: string,
  ): Promise<{ success: boolean; count: number; contests: AdminContest[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  /**
   * POST /admin/tournaments/:tournamentId/contests
   */
  async createContest(
    tournamentId: string,
    data: ContestPayload,
  ): Promise<{ success: boolean; message: string; contest: AdminContest }> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests`,
      data,
    );
    return response.data;
  },

  /**
   * GET /admin/tournaments/:tournamentId/contests/:contestId
   */
  async getContest(
    tournamentId: string,
    contestId: string,
  ): Promise<{ success: boolean; contest: AdminContest }> {
    const response = await apiClient.get(
      `/admin/tournaments/${tournamentId}/contests/${contestId}`,
    );
    return response.data;
  },

  /**
   * PATCH /admin/tournaments/:tournamentId/contests/:contestId
   */
  async updateContest(
    tournamentId: string,
    contestId: string,
    data: Partial<ContestPayload>,
  ): Promise<{ success: boolean; message: string; contest: AdminContest }> {
    const response = await apiClient.patch(
      `/admin/tournaments/${tournamentId}/contests/${contestId}`,
      data,
    );
    return response.data;
  },

  /**
   * POST /admin/tournaments/:tournamentId/contests/:contestId/publish
   * DRAFT → PUBLISHED. No Codeforces API call.
   */
  async publishContest(
    tournamentId: string,
    contestId: string,
  ): Promise<{ success: boolean; message: string; contest: AdminContest }> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/publish`,
    );
    return response.data;
  },

  /**
   * DELETE /admin/tournaments/:tournamentId/contests/:contestId
   * Only drafts can be deleted.
   */
  async deleteContest(
    tournamentId: string,
    contestId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(
      `/admin/tournaments/${tournamentId}/contests/${contestId}`,
    );
    return response.data;
  },

  /**
   * GET /admin/tournaments/:tournamentId/contests/:contestId/participants
   * Returns eligible participants (used for admin preview).
   */
  async getContestParticipants(
    tournamentId: string,
    contestId: string,
  ): Promise<{ success: boolean; count: number; participants: Participant[]; scope: string }> {
    const response = await apiClient.get(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/participants`,
    );
    return response.data;
  },

  // ---------- LEGACY (kept for backward compatibility) ----------
  async validateCodeforcesContest(
    tournamentId: string,
    contestId: number,
  ): Promise<ValidateContestResponse> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/validate/${contestId}`,
    );
    return response.data;
  },

  async syncContestResults(
    tournamentId: string,
    contestId: string,
  ): Promise<{ success: boolean; message: string; stats?: any }> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/sync`,
    );
    return response.data;
  },

  async inviteParticipantsToContest(
    contestId: string,
    participantIds: string[],
  ): Promise<{ success: boolean; invitations: Invitation[] }> {
    const response = await apiClient.post(`/admin/contests/${contestId}/invitations`, {
      participantIds,
    });
    return response.data;
  },

  // ---------- PENALTIES ----------
  async addPenalty(
    contestId: string,
    participantId: string,
    problemIndex: string,
    penalty: number,
  ): Promise<{ result: Result }> {
    const response = await apiClient.post(
      `/admin/contests/${contestId}/participants/${participantId}/penalty`,
      { problemIndex, penalty, type: 'set' },
    );
    return response.data;
  },

  // ---------- STATS ----------
  async dashboardStats(): Promise<AdminStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // ---------- SETTINGS ----------
  async getSettings(): Promise<{
    success: boolean;
    settings: {
      name: string;
      email: string;
      username: string;
      role: string;
      tournamentDefaults: {
        maxParticipants: number;
        numberOfGroups: number;
        participantsPerGroup: number;
        qualifiersPerGroup: number;
        playoffFormat: string;
      };
    };
  }> {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  async updateSettings(data: {
    name?: string;
    email?: string;
    password?: string;
    tournamentDefaults?: {
      maxParticipants?: number;
      numberOfGroups?: number;
      participantsPerGroup?: number;
      qualifiersPerGroup?: number;
      playoffFormat?: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
    settings: {
      name: string;
      email: string;
      username: string;
      role: string;
    };
  }> {
    const response = await apiClient.patch('/admin/settings', data);
    return response.data;
  },
};