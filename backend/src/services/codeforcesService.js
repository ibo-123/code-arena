class CodeforcesService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
    this.timeout = 30000; // Increased timeout to 30 seconds
  }

  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        // Handle arrays by joining with semicolon
        searchParams.append(key, value.join(';'));
      } else {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  async request(endpoint, params = {}) {
    let url = '';

    try {
      url = `${this.baseUrl}${endpoint}${this.buildQueryString(params)}`;

      console.log(`[Codeforces] GET ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response;

      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'CodeArena2026/1.0',
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const rawText = await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('[Codeforces] Failed to parse response:', rawText.substring(0, 200));
        throw new Error(
          `Codeforces returned non-JSON response (HTTP ${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          `Codeforces HTTP ${response.status}: ${
            data.comment || 'Unknown error'
          }`
        );
      }

      if (data.status === 'OK') {
        return data.result;
      }

      throw new Error(
        `Codeforces API error: ${data.comment || 'Unknown Codeforces error'}`
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Codeforces API request timed out after 30 seconds');
      }

      if (error.message?.startsWith('Codeforces API error:')) {
        throw error;
      }

      if (error.message?.startsWith('Codeforces HTTP')) {
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
    try {
      const contests = await this.request('/contest.list', { gym: false });
      const contest = contests.find(c => c.id === id);
      if (!contest) {
        throw new Error(`Contest ${id} not found on Codeforces`);
      }
      return contest;
    } catch (error) {
      console.error(`[Codeforces] Failed to get contest ${contestId}:`, error.message);
      throw error;
    }
  }

  async getContestStandings(contestId, handles = null) {
    const id = Number(contestId);

    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid Codeforces contest ID');
    }

    console.log(`[Codeforces] Fetching standings for contest ${id}`);

    try {
      const params = { contestId: id };
      
      // Only add handles if provided and not empty
      if (handles && Array.isArray(handles) && handles.length > 0) {
        // Codeforces API expects semicolon-separated handles
        params.handles = handles.join(';');
        console.log(`[Codeforces] Filtering by ${handles.length} handles`);
      }

      const result = await this.request('/contest.standings', params);

      if (!result || typeof result !== 'object') {
        throw new Error('Codeforces returned an invalid standings response');
      }

      console.log(
        `[Codeforces] Standings fetched: ${result.rows?.length || 0} rows`
      );

      return result;
    } catch (error) {
      console.error(
        `[Codeforces] Failed to fetch standings for contest ${id}:`,
        error.message
      );

      throw error;
    }
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
    if (!url) return null;
    
    const patterns = [
      /codeforces\.com\/contest\/(\d+)/,
      /codeforces\.com\/gym\/(\d+)/,
      /codeforces\.com\/problemset\/contest\/(\d+)/,
      /codeforces\.com\/problemset\/gym\/(\d+)/,
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