import apiClient from './api';
import type { AuditLog, Tournament, Participant } from '../types';

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