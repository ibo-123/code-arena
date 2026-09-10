import {apiClient} from './api';
import type { Contest, LeaderboardEntry, Result, VideoSubmission } from '../types';

export const contestApi = {
  async list(tournamentId: string): Promise<{ contests: Contest[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  async getMyContests(tournamentId: string): Promise<{ contests: Contest[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/my-contests`);
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

  async validateCodeforces(tournamentId: string, contestId: number): Promise<{ 
    success: boolean; 
    contest?: { id: number; name: string; phase: string; startTimeSeconds?: number; durationSeconds?: number } 
  }> {
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

  // Video submission endpoints
  async submitVideo(contestId: string, videoUrl: string, note?: string): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.post(`/contests/${contestId}/video-submission`, { videoUrl, note });
    return response.data;
  },

  async getMyVideoSubmission(contestId: string): Promise<{ submission: VideoSubmission | null }> {
    const response = await apiClient.get(`/contests/${contestId}/video-submission`);
    return response.data;
  },

  // Admin endpoints
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

  async addPenalty(contestId: string, participantId: string, problemIndex: string, penalty: number): Promise<{ result: Result }> {
    const response = await apiClient.post(`/admin/contests/${contestId}/participants/${participantId}/penalty`, {
      problemIndex,
      penalty,
      type: 'set',
    });
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