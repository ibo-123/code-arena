import {apiClient} from './api';
import type { AuditLog, Tournament, Participant, Bracket, Result, VideoSubmission, Invitation } from '../types';

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
    totalParticipants: number;
    qualifiedParticipants: number;
    activeContests: number;
    completedContests: number;
    upcomingMatches: number;
    recentActivity: AuditLog[];
  };
}

export const adminApi = {
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

  async health(): Promise<{ success: boolean; message: string; timestamp: string; admin: string }> {
    const response = await apiClient.get('/admin/health');
    return response.data;
  },

  // Tournament Management
  async createTournament(data: Record<string, unknown>): Promise<{ success: boolean; message: string; tournament: Tournament }> {
    const response = await apiClient.post('/admin/tournaments', data);
    return response.data;
  },

  async updateTournament(tournamentId: string, data: Record<string, unknown>): Promise<{ success: boolean; message: string; tournament: Tournament }> {
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

  // Participant Management
  async getParticipants(tournamentId: string): Promise<{ participants: Participant[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/participants`);
    return response.data;
  },

  async approveParticipant(tournamentId: string, participantId: string): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/tournaments/${tournamentId}/participants/${participantId}/approve`);
    return response.data;
  },

  async rejectParticipant(tournamentId: string, participantId: string): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/tournaments/${tournamentId}/participants/${participantId}/reject`);
    return response.data;
  },

  async updateParticipant(tournamentId: string, participantId: string, data: Partial<Participant>): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/admin/tournaments/${tournamentId}/participants/${participantId}`, data);
    return response.data;
  },

  // Standings
  async getStandings(tournamentId: string): Promise<{ leaderboard: any[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/standings`);
    return response.data;
  },

  async getGroupStandings(tournamentId: string, groupId: string): Promise<{ standings: any[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/groups/${groupId}/standings`);
    return response.data;
  },

  // Bracket/Match Management
  async getBracket(tournamentId: string): Promise<{ bracket: Bracket }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/bracket`);
    return response.data;
  },

  async getMatches(tournamentId: string, stage?: string): Promise<{ matches: any[] }> {
    const params = stage ? `?stage=${stage}` : '';
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/matches${params}`);
    return response.data;
  },

  async setMatchWinner(matchId: string, winnerId: string): Promise<{ match: any }> {
    const response = await apiClient.patch(`/admin/matches/${matchId}/winner`, { winnerId });
    return response.data;
  },

  // Video Submission Management
  async getVideoSubmissions(contestId: string): Promise<{ submissions: VideoSubmission[] }> {
    const response = await apiClient.get(`/admin/contests/${contestId}/video-submissions`);
    return response.data;
  },

  async approveVideo(submissionId: string): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(`/admin/video-submissions/${submissionId}/approve`);
    return response.data;
  },

  async rejectVideo(submissionId: string, reason?: string): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(`/admin/video-submissions/${submissionId}/reject`, { reason });
    return response.data;
  },

  // Contest Management
  async validateCodeforcesContest(tournamentId: string, contestId: number): Promise<ValidateContestResponse> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests/validate/${contestId}`);
    return response.data;
  },

  async createContest(tournamentId: string, data: Record<string, unknown>): Promise<{ success: boolean; message: string; contest: any }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests`, data);
    return response.data;
  },

  async inviteParticipantsToContest(contestId: string, participantIds: string[]): Promise<{ success: boolean; invitations: Invitation[] }> {
    const response = await apiClient.post(`/admin/contests/${contestId}/invitations`, { participantIds });
    return response.data;
  },

  // Penalty Management
  async addPenalty(contestId: string, participantId: string, problemIndex: string, penalty: number): Promise<{ result: Result }> {
    const response = await apiClient.post(`/admin/contests/${contestId}/participants/${participantId}/penalty`, {
      problemIndex,
      penalty,
      type: 'set',
    });
    return response.data;
  },

  // Stats
  async dashboardStats(): Promise<AdminStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Admin Settings
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