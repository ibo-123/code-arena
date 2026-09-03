
// createParticipants.js
const axios = require('axios');

// ---- CONFIG ----
const BASE_URL = 'http://localhost:8080/api';
const TOURNAMENT_ID = '6a9955f8277791aa8373a53b';
const PASSWORD = 'Test123!';

// Codeforces participants from Gym 709424 standings
const handles = [
  'Seid11',
  'amiiines',
  'HayatAbdulfetah',
  'hanifesmail4466',
  'fk_cp',
  'asmau_usman',
  'salimm',
  'zikraimamusultan',
  'Suha_endris',
  'moonlight1170',
  '_Hafsa44',
  'Ferah_123',
  'asliiiisaa5',
  'emu-1803',
  'Assuu',
  'Emunabdus',
  'Awels',
  'tesnim-flow',
  'sume2',
  'MiftahMoh99',
  'Muaabdusamed',
  'hasuu',
  'Ziyad93',
  'Hudish',
  'flenbarhussain41',
  'Nesrin_mohammed',
  'Lumiya',
  'Widad022',
  'ASK69',
  'Muna_a',
  'Rim16'
];

// Generate users using the Codeforces handle
const users = handles.map((handle, i) => ({
  username: handle,
  password: PASSWORD,
  email: `${handle.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
  name: handle,
  codeforcesUsername: handle,
}));

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ---- API helpers ----
const api = axios.create({
  baseURL: BASE_URL,
});

async function registerUser(user) {
  const res = await api.post('/auth/register', user);
  return res.data;
}

async function loginUser(username, password) {
  const res = await api.post('/auth/login', {
    username,
    password,
  });

  return res.data.token;
}

async function joinTournament(token) {
  const res = await api.post(
    `/tournaments/${TOURNAMENT_ID}/join`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

// ---- Main ----
(async function main() {
  console.log(`🚀 Creating ${users.length} participants...`);

  const results = [];

  for (const [i, user] of users.entries()) {
    try {
      // 1. Register
      await registerUser(user);

      process.stdout.write(
        `✅ [${i + 1}/${users.length}] Registered: ${user.username} `
      );

      // 2. Login
      const token = await loginUser(
        user.username,
        user.password
      );

      process.stdout.write(`🔑 Logged in `);

      // 3. Join tournament
      await joinTournament(token);

      console.log(`🎯 Joined tournament`);

      results.push({
        username: user.username,
        codeforcesUsername: user.codeforcesUsername,
        status: 'success',
      });

      await delay(500);

    } catch (err) {
      console.error(
        `❌ [${i + 1}] Failed for ${user.username}:`,
        err.response?.data?.message || err.message
      );

      results.push({
        username: user.username,
        codeforcesUsername: user.codeforcesUsername,
        status: 'failed',
        error: err.response?.data?.message || err.message,
      });
    }
  }

  console.log('\n📊 Summary:');
  console.table(results);
})();
