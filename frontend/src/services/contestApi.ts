import apiClient from './api';
import type { Contest, LeaderboardEntry, Result } from '../types';

export const contestApi = {
  async list(tournamentId: string): Promise<{ contests: Contest[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  async get(tournamentId: string, contestId: string): Promise<{ contest: Contest }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests/${contestId}`);
    return response.data;
  },

  async leaderboard(tournamentId: string, contestId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests/${contestId}/leaderboard`);
    return response.data;
  },

  async results(tournamentId: string, contestId: string): Promise<{ results: Result[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests/${contestId}/results`);
    return response.data;
  },

  async validateCodeforces(tournamentId: string, contestId: number): Promise<{ success: boolean; contest?: { id: number; name: string; phase: string } }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests/validate/${contestId}`);
    return response.data;
  },

  async create(
    tournamentId: string,
    data: {
      codeforcesContestId: number;
      stage: string;
      group?: string;
      matchNumber?: number;
    }
  ): Promise<{ contest: Contest }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests`, data);
    return response.data;
  },

  async sync(
    tournamentId: string,
    contestId: string
  ): Promise<{
    success: boolean;
    message: string;
    stats?: { total: number; matched: number; unmatched: number; updated: number };
    results?: Result[];
    unmatchedHandles?: string[];
  }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests/${contestId}/sync`);
    return response.data;
  },
};
