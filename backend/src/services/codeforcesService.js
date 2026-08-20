const getApiResult = async (contestId, count = 10000) => {
  if (!Number.isInteger(Number(contestId)) || Number(contestId) <= 0) throw new Error("Invalid Codeforces contest ID");
  let response;
  try {
    response = await fetch(`https://codeforces.com/api/contest.standings?contestId=${encodeURIComponent(contestId)}&from=1&count=${count}&showUnofficial=false`);
  } catch (_) { throw new Error("Unable to reach Codeforces API"); }
  if (!response.ok) throw new Error("Codeforces API request failed");
  let data;
  try { data = await response.json(); } catch (_) { throw new Error("Invalid response from Codeforces API"); }
  if (data.status !== "OK") throw new Error(data.comment || "Codeforces API request failed");
  return data.result;
};

module.exports = {
  getContestStandings: (contestId) => getApiResult(contestId),
  getContestStatus: async (contestId) => (await getApiResult(contestId, 1)).contest,
};
