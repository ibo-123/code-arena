// createParticipants.js
const axios = require('axios'); // npm install axios if not installed

// ---- CONFIG ----
const BASE_URL = 'http://localhost:8080/api'; // change if needed
const TOURNAMENT_ID = '6a966128fa82833dc5b09ea2';
const USER_COUNT = 19;
const PASSWORD = 'Test123!';

// Generate user data
const users = Array.from({ length: USER_COUNT }, (_, i) => ({
  username: `testuser${39*i + 1}`,
  password: PASSWORD,
  email: `test${39*i + 1}@example.com`,
  name: `Test User ${39*i + 1}`,
  codeforcesUsername: `cf_user_${39*i + 1}`,
}));

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ---- API helpers ----
const api = axios.create({ baseURL: BASE_URL });

async function registerUser(user) {
  const res = await api.post('/auth/register', user);
  return res.data;
}

async function loginUser(username, password) {
  const res = await api.post('/auth/login', { username, password });
  return res.data.token; // adjust if token path differs
}

async function joinTournament(token) {
  const res = await api.post(`/tournaments/${TOURNAMENT_ID}/join`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ---- Main ----
(async function main() {
  console.log(`🚀 Creating ${USER_COUNT} test users & registering...`);
  const results = [];

  for (const [i, user] of users.entries()) {
    try {
      // 1. Register
      await registerUser(user);
      process.stdout.write(`✅ [${i+1}] Registered: ${user.username} `);

      // 2. Login
      const token = await loginUser(user.username, user.password);
      process.stdout.write(`🔑 Logged in `);

      // 3. Join tournament
      await joinTournament(token);
      console.log(`🎯 Joined tournament`);

      results.push({ username: user.username, status: 'success' });
      await delay(300); // avoid rate limiting
    } catch (err) {
      console.error(`❌ [${i+1}] Failed for ${user.username}:`, err.response?.data?.message || err.message);
      results.push({ username: user.username, status: 'failed', error: err.message });
    }
  }

  console.log('\n📊 Summary:');
  console.table(results);
})();