const test = require("node:test");
const assert = require("node:assert/strict");
const codeforcesService = require("../src/services/codeforcesService");

const originalFetch = global.fetch;
test.after(() => { global.fetch = originalFetch; });

test("returns Codeforces standings from a successful API response", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ status: "OK", result: { contest: { id: 1 }, problems: [], rows: [] } }) });
  const standings = await codeforcesService.getContestStandings(1);
  assert.deepEqual(standings.rows, []);
});

test("rejects an invalid contest ID without requesting Codeforces", async () => {
  global.fetch = async () => { throw new Error("should not be called"); };
  await assert.rejects(codeforcesService.getContestStandings("invalid"), /Invalid Codeforces contest ID/);
});

test("surfaces Codeforces API errors", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ status: "FAILED", comment: "contestId: Contest not found" }) });
  await assert.rejects(codeforcesService.getContestStatus(123), /Contest not found/);
});
