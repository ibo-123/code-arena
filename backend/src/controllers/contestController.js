const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Tournament = require('../models/Tournament');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const codeforcesService = require('../services/codeforcesService');

exports.validateCodeforcesContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!contestId) {
      return res.status(400).json({ success: false, message: 'Contest ID is required' });
    }

    const id = parseInt(contestId, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contest ID' });
    }

    const result = await codeforcesService.validateContest(id);
    if (!result.valid) {
      return res.status(404).json({ success: false, message: result.error || 'Contest not found' });
    }

    return res.json({
      success: true,
      contest: {
        id: result.contest.id,
        name: result.contest.name,
        type: result.contest.type,
        phase: result.contest.phase,
        startTime: new Date(result.contest.startTimeSeconds * 1000),
        durationSeconds: result.contest.durationSeconds,
        url: codeforcesService.formatContestUrl(result.contest.id),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to validate contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.publishContest = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { codeforcesContestId, stage, group, matchNumber } = req.body;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    if (!codeforcesContestId || !stage) {
      return res.status(400).json({
        success: false,
        message: 'Codeforces contest ID and stage are required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const validation = await codeforcesService.validateContest(codeforcesContestId);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Invalid Codeforces contest',
      });
    }

    const existing = await Contest.findOne({ tournamentId, codeforcesContestId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Contest already published to this tournament',
      });
    }

    const contest = new Contest({
      tournamentId,
      codeforcesContestId: validation.contest.id,
      codeforcesContestName: validation.contest.name,
      codeforcesUrl: codeforcesService.formatContestUrl(validation.contest.id),
      type: validation.contest.type,
      phase: validation.contest.phase,
      startTime: new Date(validation.contest.startTimeSeconds * 1000),
      durationSeconds: validation.contest.durationSeconds,
      stage,
      group: stage === 'GROUP_STAGE' ? group : undefined,
      matchNumber: stage !== 'GROUP_STAGE' ? matchNumber : undefined,
      status: 'UPCOMING',
      published: true,
      publishedAt: new Date(),
    });

    await contest.save();

    const auditLog = new AuditLog({
      action: 'CONTEST_PUBLISHED',
      description: `Published contest ${validation.contest.name} (${validation.contest.id})`,
      admin: req.user?._id,
      tournament: tournamentId,
      details: { contestId: validation.contest.id, stage, group, matchNumber },
    });
    await auditLog.save();

    return res.status(201).json({
      success: true,
      message: 'Contest published successfully',
      contest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to publish contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    const contests = await Contest.find({ tournamentId }).sort({ startTime: 1 }).lean();
    return res.json({ success: true, contests });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid contest ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId }).lean();
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    return res.json({ success: true, contest });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid contest ID' });
    }

    const results = await Result.find({ contestId, tournamentId })
      .populate({
        path: 'participantId',
        select: 'group seed user',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      })
      .sort({ rank: 1 })
      .lean();

    const normalized = results.map(r => ({
      ...r,
      participant: r.participantId,
      score: r.points,
      solved: r.solvedCount,
    }));

    return res.json({ success: true, count: normalized.length, results: normalized });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.syncResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid contest ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const participants = await Participant.find({
      tournamentId,
      'user.codeforcesUsername': { $exists: true, $ne: '' },
    }).populate('user');

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants with Codeforces handles found',
      });
    }

    const handles = participants
      .map(p => p.user?.codeforcesUsername)
      .filter(h => h && h.length > 0);

    const standings = await codeforcesService.getContestStandings(
      contest.codeforcesContestId,
      handles
    );

    const handleMap = new Map();
    participants.forEach(p => {
      const handle = p.user?.codeforcesUsername;
      if (handle) handleMap.set(handle.toUpperCase(), p);
    });

    let matched = 0;
    let unmatched = 0;
    let updated = 0;

    for (const row of standings.rows) {
      const member = row.party.members[0];
      if (!member) continue;

      const handle = member.handle.toUpperCase();
      const participant = handleMap.get(handle);

      if (!participant) {
        unmatched++;
        continue;
      }

      matched++;

      const problemResults = row.problemResults.map((pr, index) => ({
        problemIndex: standings.problems[index]?.index || String.fromCharCode(65 + index),
        problemName: standings.problems[index]?.name || `Problem ${String.fromCharCode(65 + index)}`,
        points: pr.points || 0,
        solved: pr.points > 0,
        wrongAttempts: pr.rejectedAttemptCount || 0,
        bestSubmissionTime: pr.bestSubmissionTimeSeconds || undefined,
      }));

      const result = await Result.findOneAndUpdate(
        { contestId, participantId: participant._id },
        {
          contestId,
          tournamentId,
          participantId: participant._id,
          codeforcesHandle: handle,
          rank: row.rank || 0,
          points: row.points || 0,
          penalty: row.penalty || 0,
          solvedCount: row.problemResults.filter(pr => pr.points > 0).length,
          problemResults,
          syncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      if (result) updated++;
    }

    contest.lastSyncedAt = new Date();
    contest.syncedCount += 1;
    await contest.save();

    const auditLog = new AuditLog({
      action: 'RESULTS_SYNCED',
      description: `Synced results for contest ${contest.codeforcesContestName}`,
      admin: req.user?._id,
      tournament: tournamentId,
      details: { matched, unmatched, updated },
    });
    await auditLog.save();

    return res.json({
      success: true,
      message: 'Results synchronized successfully',
      stats: {
        total: participants.length,
        matched,
        unmatched,
        updated,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to sync results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid contest ID' });
    }

    const results = await Result.find({ contestId, tournamentId })
      .populate('participantId', 'user group seed')
      .sort({ rank: 1 })
      .lean();

    const leaderboard = results.map((r, index) => ({
      rank: r.rank || index + 1,
      participantId: r.participantId._id,
      username: r.participantId?.user?.username || 'Unknown',
      codeforcesUsername: r.codeforcesHandle,
      group: r.participantId?.group,
      solved: r.solvedCount,
      score: r.points,
      penalty: r.penalty,
    }));

    return res.json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
