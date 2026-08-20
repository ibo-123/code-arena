const Contest = require("../models/Contest");
const Tournament = require("../models/Tournament");
const Match = require("../models/Match");
const ContestResult = require("../models/ContestResult");
const contestService = require("../services/contestService");
const codeforcesService = require("../services/codeforcesService");
const auditLogService = require("../services/auditLogService");

const belongsToTournament = async (tournamentId, contestId) => Contest.findOne({ _id: contestId, tournament: tournamentId });

const createContest = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, group, matchNumber, name, codeforcesContestId, codeforcesUrl, startTime, durationMinutes } = req.body;
    const validRounds = ["GROUP_STAGE", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"];
    if (!validRounds.includes(round) || !name || !codeforcesContestId || !codeforcesUrl || !startTime || !durationMinutes) {
      return res.status(400).json({ success: false, message: "round, name, Codeforces details, startTime, and durationMinutes are required" });
    }
    if (Number(durationMinutes) <= 0 || Number.isNaN(new Date(startTime).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid startTime or durationMinutes" });
    }
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    let match = null;
    if (round === "GROUP_STAGE") {
      if (!["A", "B", "C", "D"].includes(group)) return res.status(400).json({ success: false, message: "A valid group is required for group-stage contests" });
    } else {
      if (group) return res.status(400).json({ success: false, message: "Knockout contests cannot have a group" });
      if (matchNumber === undefined || matchNumber === null || !Number.isInteger(Number(matchNumber)) || Number(matchNumber) < 1) return res.status(400).json({ success: false, message: "matchNumber is required for knockout contests" });
      match = await Match.findOne({ tournament: tournamentId, round, matchNumber });
      if (!match) return res.status(409).json({ success: false, message: "This matchup has not been created yet" });
      if (match.contest) return res.status(409).json({ success: false, message: "A contest is already attached to this matchup" });
    }
    await codeforcesService.getContestStatus(Number(codeforcesContestId));
    const contest = await Contest.create({ tournament: tournamentId, round, group: round === "GROUP_STAGE" ? group : null,
      matchNumber: match ? Number(matchNumber) : null, match: match && match._id, name, codeforcesContestId: Number(codeforcesContestId), codeforcesUrl,
      startTime: new Date(startTime), durationMinutes: Number(durationMinutes), status: "PUBLISHED" });
    if (match) { match.contest = contest._id; await match.save(); }
    await auditLogService.record({ action: "CONTEST_CREATED", description: `Attached Codeforces contest ${contest.codeforcesContestId}`, admin: req.user.userId, tournament: tournamentId, metadata: { contest: contest._id, round } });
    return res.status(201).json({ success: true, contest });
  } catch (error) {
    const status = error && error.code === 11000 ? 409 : error.message && error.message.includes("Codeforces") ? 400 : 500;
    return res.status(status).json({ success: false, message: status === 500 ? "Server error" : error.message });
  }
};

const getContests = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    const contests = await Contest.find({ tournament: tournament._id }).sort({ round: 1, group: 1, matchNumber: 1 });
    await Promise.all(contests.map(contestService.updateContestStatus));
    return res.json({ success: true, contests });
  } catch (_) { return res.status(500).json({ success: false, message: "Server error" }); }
};

const getLeaderboard = async (req, res) => {
  try {
    const contest = await belongsToTournament(req.params.tournamentId, req.params.contestId);
    if (!contest) return res.status(404).json({ success: false, message: "Contest not found" });
    const leaderboard = await contestService.leaderboard(contest);
    return res.json({ success: true, contest: { id: contest._id, name: contest.name, status: contest.status }, leaderboard, lastSyncedAt: new Date() });
  } catch (error) { return res.status(502).json({ success: false, message: error.message || "Unable to load leaderboard" }); }
};

const syncContestResults = async (req, res) => {
  try {
    const contest = await belongsToTournament(req.params.tournamentId, req.params.contestId);
    if (!contest) return res.status(404).json({ success: false, message: "Contest not found" });
    const { results, unmatchedHandles } = await contestService.syncResults(contest);
    await auditLogService.record({ action: "CONTEST_SYNCED", description: `Synchronized ${results.length} contest results`, admin: req.user.userId, tournament: contest.tournament, metadata: { contest: contest._id, unmatchedHandles } });
    return res.json({ success: true, message: "Contest results synchronized successfully", results, unmatchedHandles });
  } catch (error) { return res.status(502).json({ success: false, message: error.message || "Unable to synchronize results" }); }
};

const getContestResults = async (req, res) => {
  try {
    const contest = await belongsToTournament(req.params.tournamentId, req.params.contestId);
    if (!contest) return res.status(404).json({ success: false, message: "Contest not found" });
    const results = await ContestResult.find({ contest: contest._id }).populate({ path: "participant", populate: { path: "user", select: "name username codeforcesUsername" } }).sort({ rank: 1 });
    return res.json({ success: true, results });
  } catch (_) { return res.status(500).json({ success: false, message: "Server error" }); }
};

module.exports = { createContest, getContests, getLeaderboard, syncContestResults, getContestResults };
