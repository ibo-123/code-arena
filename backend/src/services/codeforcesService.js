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
    } catch {
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
      throw new Error('Codeforces API request timed out');
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

  // IMPORTANT:
  // Codeforces currently restricts regular public contests to:
  //   /api/contest.standings?contestId=<id>
  //
  // Do NOT send:
  //   handles
  //   showUnofficial
  //   asManager
  // for regular public contests.

  console.log(`[Codeforces] Fetching standings for contest ${id}`);

  try {
    const result = await this.request('/contest.standings', {
      contestId: id,
    });

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
