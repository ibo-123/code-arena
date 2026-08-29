class CodeforcesService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
    this.timeout = 10000;
  }

  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      searchParams.append(key, String(value));
    }
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  async request(endpoint, params = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}${this.buildQueryString(params)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      }
      throw new Error(data.comment || 'Codeforces API error');
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Codeforces API request timed out');
      }
      if (error.message?.startsWith('Codeforces API error:')) {
        throw error;
      }
      throw new Error(`Codeforces API error: ${error.message}`);
    }
  }

  async getContest(contestId) {
    const id = Number(contestId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid Codeforces contest ID');
    }
    const contests = await this.request('/contest.list', { gym: false });
    const contest = contests.find(c => c.id === id);
    if (!contest) {
      throw new Error(`Contest ${id} not found on Codeforces`);
    }
    return contest;
  }

  async getContestStandings(contestId, handles = null) {
    const id = Number(contestId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid Codeforces contest ID');
    }
    const params = {
      contestId: id,
      asManager: false,
      showUnofficial: false,
    };
    if (handles && handles.length > 0) {
      params.handles = handles.join(';');
    }
    return this.request('/contest.standings', params);
  }

  async getContestStatus(contestId) {
    const contest = await this.getContest(contestId);
    return contest.phase;
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
