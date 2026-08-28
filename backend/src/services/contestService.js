const ContestResult = require("../models/ContestResult");
const Participant = require("../models/Participant");
const codeforcesService = require("./codeforcesService");

const updateContestStatus = async (contest) => {
  const now = new Date();
  const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationMinutes * 60000);
  contest.status = now < contest.startTime ? "PUBLISHED" : now < endTime ? "LIVE" : "FINISHED";
  if (contest.status === "FINISHED" && !contest.finishedAt) contest.finishedAt = endTime;
  await contest.save();
  return contest;
};

const getParticipants = (contest) => {
  if (contest.match) {
    const Match = require("../models/Match");
    return Match.findById(contest.match).populate({ path: "participants", populate: { path: "user", select: "name username codeforcesUsername" } })
      .then((match) => match ? match.participants : []);
  }
  const query = { tournament: contest.tournament };
  if (contest.group) query.group = contest.group;
  return Participant.find(query).populate("user", "name username codeforcesUsername");
};
const handleOf = (row) => row.party && row.party.members && row.party.members[0] && row.party.members[0].handle;
const matchingRows = (data, participants) => {
  const handles = new Map(participants.map((participant) => [participant.user.codeforcesUsername.toLowerCase(), participant]));
  return data.rows.map((row) => ({ row, handle: handleOf(row), participant: handles.get((handleOf(row) || "").toLowerCase()) }))
    .filter((entry) => entry.participant);
};

const leaderboard = async (contest) => {
  await updateContestStatus(contest);
  const [data, participants] = await Promise.all([codeforcesService.getContestStandings(contest.codeforcesContestId), getParticipants(contest)]);
  return matchingRows(data, participants).map(({ row, participant }) => ({
    rank: row.rank, participantId: participant._id, name: participant.user.name, username: participant.user.username,
    codeforcesUsername: participant.user.codeforcesUsername, solved: (row.problemResults || []).filter((item) => item.points > 0).length,
    score: row.points || 0, penalty: row.penalty || 0,
    problemResults: (row.problemResults || []).map((item, index) => ({
      problemIndex: data.problems[index] && data.problems[index].index,
      status: item.points > 0 ? "SOLVED" : item.rejectedAttemptCount ? "FAILED" : "UNATTEMPTED",
      points: item.points || 0,
    })),
  }));
};

const syncResults = async (contest) => {
  await updateContestStatus(contest);
  const [data, participants] = await Promise.all([codeforcesService.getContestStandings(contest.codeforcesContestId), getParticipants(contest)]);
  const rows = matchingRows(data, participants);
  const results = await Promise.all(rows.map(({ row, handle, participant }) => {
    const problemResults = (row.problemResults || []).map((item, index) => ({
      problemIndex: data.problems[index] && data.problems[index].index,
      status: item.points > 0 ? "SOLVED" : item.rejectedAttemptCount ? "FAILED" : "UNATTEMPTED",
      points: item.points || 0, attempts: (item.rejectedAttemptCount || 0) + (item.points > 0 ? 1 : 0),
    }));
    return ContestResult.findOneAndUpdate({ contest: contest._id, participant: participant._id }, {
      codeforcesHandle: handle, rank: row.rank, score: row.points || 0, penalty: row.penalty || 0,
      solved: problemResults.filter((item) => item.status === "SOLVED").length, problemResults, syncedAt: new Date(),
    }, { upsert: true, new: true, runValidators: true });
  }));
  contest.lastSyncedAt = new Date();
  await contest.save();
  const registered = new Set(participants.map((participant) => participant.user.codeforcesUsername.toLowerCase()));
  return { results, unmatchedHandles: data.rows.map(handleOf).filter(Boolean).filter((handle) => !registered.has(handle.toLowerCase())) };
};

module.exports = { updateContestStatus, leaderboard, syncResults };
