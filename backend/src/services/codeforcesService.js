const axios = require('axios');

class CodeforcesService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
    this.timeout = 10000;
  }

  async request(endpoint, params = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, {
        params,
        timeout: this.timeout,
        headers: { 'Accept': 'application/json' },
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }
      throw new Error(response.data.comment || 'Codeforces API error');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Codeforces API request timed out');
        }
        if (error.response?.status === 404) {
          throw new Error('Contest not found on Codeforces');
        }
        throw new Error(`Codeforces API error: ${error.message}`);
      }
      throw error;
    }
  }

  async getContest(contestId) {
    const contests = await this.request('/contest.list', { gym: false });
    const contest = contests.find(c => c.id === contestId);
    if (!contest) {
      throw new Error(`Contest ${contestId} not found on Codeforces`);
    }
    return contest;
  }

  async getContestStandings(contestId, handles = null) {
    const params = {
      contestId,
      asManager: false,
      showUnofficial: false,
    };
    if (handles && handles.length > 0) {
      params.handles = handles.join(';');
    }
    return this.request('/contest.standings', params);
  }

  async validateContest(contestId) {
    try {
      const contest = await this.getContest(contestId);
      return { valid: true, contest };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  extractContestIdFromUrl(url) {
    const patterns = [
      /codeforces\.com\/contest\/(\d+)/,
      /codeforces\.com\/gym\/(\d+)/,
      /codeforces\.com\/problemset\/contest\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  }

  formatContestUrl(contestId) {
    return `https://codeforces.com/contest/${contestId}`;
  }
}

module.exports = new CodeforcesService();
