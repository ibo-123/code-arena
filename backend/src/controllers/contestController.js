// src/controllers/contestController.js

const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Tournament = require('../models/Tournament');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const Match = require('../models/Match');
const VideoSubmission = require('../models/VideoSubmission');

const codeforcesService = require('../services/codeforcesService');

// ============================================================
// VALIDATE CODEFORCES CONTEST
// ============================================================

exports.validateCodeforcesContest = async (req, res) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    const id = Number(contestId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const result = await codeforcesService.validateContest(id);

    if (!result.valid) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Contest not found or not accessible',
      });
    }

    const contest = result.contest;

    return res.json({
      success: true,
      contest: {
        id: contest.id,
        name: contest.name,
        type: contest.type,
        phase: contest.phase,
        startTime: contest.startTimeSeconds
          ? new Date(contest.startTimeSeconds * 1000)
          : null,
        durationSeconds: contest.durationSeconds || 0,
        url: codeforcesService.formatContestUrl(contest.id),
      },
    });
  } catch (error) {
    console.error('[validateCodeforcesContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to validate contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// PUBLISH CONTEST
// ============================================================

exports.publishContest = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const {
      codeforcesContestId,
      stage,
      group,
      matchNumber,
    } = req.body;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!codeforcesContestId || !stage) {
      return res.status(400).json({
        success: false,
        message: 'Codeforces contest ID and stage are required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const validation = await codeforcesService.validateContest(codeforcesContestId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Invalid Codeforces contest',
      });
    }

    const existing = await Contest.findOne({
      tournamentId,
      codeforcesContestId,
    });

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

    // Attach knockout contest to Match
    if (stage !== 'GROUP_STAGE' && matchNumber !== undefined && matchNumber !== null) {
      try {
        const found = await Match.findOne({
          tournament: tournamentId,
          matchNumber,
        });

        if (found) {
          found.contest = contest._id;
          await found.save();
        }
      } catch (error) {
        console.error('[publishContest] Failed to attach match:', error);
      }
    }

    const auditLog = new AuditLog({
      action: 'CONTEST_PUBLISHED',
      description: `Published contest ${validation.contest.name} (${validation.contest.id})`,
      admin: req.user?._id,
      tournament: tournamentId,
      details: {
        contestId: validation.contest.id,
        stage,
        group,
        matchNumber,
      },
    });

    await auditLog.save();

    return res.status(201).json({
      success: true,
      message: 'Contest published successfully',
      contest,
    });
  } catch (error) {
    console.error('[publishContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to publish contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET CONTESTS
// ============================================================

exports.getContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({
      tournamentId,
    })
      .sort({ startTime: 1 })
      .lean();

    // Update status for each contest based on current time
    const now = new Date();
    const updatedContests = contests.map(contest => {
      const start = new Date(contest.startTime);
      const end = new Date(start.getTime() + contest.durationSeconds * 1000);
      
      let status = contest.status;
      if (now < start) {
        status = 'UPCOMING';
      } else if (now >= start && now < end) {
        status = 'LIVE';
      } else {
        status = 'FINISHED';
      }
      
      return {
        ...contest,
        status,
        isUpcoming: status === 'UPCOMING',
        isLive: status === 'LIVE',
        isFinished: status === 'FINISHED',
        startTime: start,
        endTime: end,
        timeRemaining: status === 'LIVE' ? Math.max(0, end - now) : null,
      };
    });

    return res.json({
      success: true,
      contests: updatedContests,
    });
  } catch (error) {
    console.error('[getContests] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET SINGLE CONTEST
// ============================================================

exports.getContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    }).lean();

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Calculate contest status
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(start.getTime() + contest.durationSeconds * 1000);
    
    let status = contest.status;
    if (now < start) {
      status = 'UPCOMING';
    } else if (now >= start && now < end) {
      status = 'LIVE';
    } else {
      status = 'FINISHED';
    }

    // Check if user has submitted a video
    let userSubmission = null;
    if (req.user) {
      const userId = req.user.userId || req.user._id;
      const participant = await Participant.findOne({
        tournamentId,
        user: userId,
      });
      
      if (participant) {
        userSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: participant._id,
        });
      }
    }

    return res.json({
      success: true,
      contest: {
        ...contest,
        status,
        isUpcoming: status === 'UPCOMING',
        isLive: status === 'LIVE',
        isFinished: status === 'FINISHED',
        startTime: start,
        endTime: end,
        timeRemaining: status === 'LIVE' ? Math.max(0, end - now) : null,
        userSubmission: userSubmission || null,
      },
    });
  } catch (error) {
    console.error('[getContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET RESULTS
// ============================================================

exports.getResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Check if contest has ended
    const now = new Date();
    const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000);
    const isFinished = now >= endTime;

    const results = await Result.find({
      contestId,
      tournamentId,
    })
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

    // For each result, check if video is approved
    const resultsWithVideoStatus = await Promise.all(
      results.map(async (r) => {
        const videoSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: r.participantId?._id,
        });

        return {
          ...r,
          participant: r.participantId,
          score: r.points,
          solved: r.solvedCount,
          videoStatus: videoSubmission?.status || 'NOT_SUBMITTED',
          isEligible: videoSubmission?.status === 'APPROVED',
          // Results only count if contest is finished AND video is approved
          isCounted: isFinished && videoSubmission?.status === 'APPROVED',
        };
      })
    );

    const normalized = resultsWithVideoStatus.map((r) => ({
      ...r,
      participant: r.participantId,
      score: r.points,
      solved: r.solvedCount,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      contestStatus: isFinished ? 'FINISHED' : 'ONGOING',
      results: normalized,
    });
  } catch (error) {
    console.error('[getResults] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// SYNC RESULTS
// ============================================================

exports.syncResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    console.log('[syncResults] Starting sync', { tournamentId, contestId });

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    console.log('[syncResults] Contest found:', {
      id: contest._id.toString(),
      codeforcesContestId: contest.codeforcesContestId,
      name: contest.codeforcesContestName,
    });

    if (!contest.codeforcesContestId) {
      return res.status(400).json({
        success: false,
        message: 'This contest does not have a Codeforces contest ID',
      });
    }

    // Find tournament participants
    const allParticipants = await Participant.find({
      tournamentId,
      registrationStatus: 'APPROVED',
    }).populate('user');

    console.log('[syncResults] Participants found:', allParticipants.length);

    const participants = allParticipants.filter(
      (participant) =>
        participant.user &&
        typeof participant.user.codeforcesUsername === 'string' &&
        participant.user.codeforcesUsername.trim() !== ''
    );

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants with Codeforces handles found',
      });
    }

    // Prepare handles
    const handles = participants
      .map((participant) => participant.user.codeforcesUsername.trim())
      .filter(Boolean);

    console.log('[syncResults] Codeforces handles:', handles);

    // Fetch Codeforces standings
    console.log('[syncResults] Fetching Codeforces standings...', contest.codeforcesContestId);

    let standings;

    try {
      standings = await codeforcesService.getContestStandings(
        Number(contest.codeforcesContestId),
        handles
      );
    } catch (error) {
      console.error('[syncResults] Codeforces standings ERROR:', error);

      return res.status(502).json({
        success: false,
        message: 'Failed to fetch standings from Codeforces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    if (!standings) {
      return res.status(502).json({
        success: false,
        message: 'Codeforces returned an empty standings response',
      });
    }

    if (!Array.isArray(standings.rows)) {
      console.error('[syncResults] Invalid standings:', standings);

      return res.status(502).json({
        success: false,
        message: 'Invalid standings response from Codeforces',
      });
    }

    console.log('[syncResults] Standings rows:', standings.rows.length);

    // Create participant handle map
    const handleMap = new Map();

    participants.forEach((participant) => {
      const handle = participant.user?.codeforcesUsername;

      if (handle) {
        handleMap.set(handle.trim().toUpperCase(), participant);
      }
    });

    // Process standings
    let matched = 0;
    let unmatched = 0;
    let updated = 0;

    const syncedResultsList = [];
    const unmatchedHandlesList = [];

    for (const row of standings.rows) {
      const member = row.party?.members?.[0];

      if (!member || !member.handle) {
        continue;
      }

      const handle = member.handle.trim().toUpperCase();

      const participant = handleMap.get(handle);

      if (!participant) {
        unmatched++;
        unmatchedHandlesList.push(member.handle);
        continue;
      }

      matched++;

      const problemResults = Array.isArray(row.problemResults)
        ? row.problemResults.map((problemResult, index) => {
            const problem = standings.problems?.[index];

            const problemIndex = problem?.index || String.fromCharCode(65 + index);
            const problemName = problem?.name || `Problem ${String.fromCharCode(65 + index)}`;

            return {
              problemIndex,
              problemName,
              points: problemResult.points || 0,
              solved: problemResult.points > 0,
              wrongAttempts: problemResult.rejectedAttemptCount || 0,
              bestSubmissionTime: problemResult.bestSubmissionTimeSeconds || undefined,
            };
          })
        : [];

      const solvedCount = problemResults.filter((problem) => problem.solved).length;

      // Calculate penalty properly
      let totalPenalty = 0;
      for (const pr of problemResults) {
        if (pr.solved && pr.bestSubmissionTime) {
          totalPenalty += pr.bestSubmissionTime;
          totalPenalty += (pr.wrongAttempts || 0) * 20; // Standard CF penalty
        }
      }

      const result = await Result.findOneAndUpdate(
        {
          contestId,
          participantId: participant._id,
        },
        {
          contestId,
          tournamentId,
          participantId: participant._id,
          codeforcesHandle: member.handle,
          rank: row.rank || 0,
          points: row.points || 0,
          penalty: totalPenalty,
          solvedCount,
          problemResults,
          syncedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      if (result) {
        updated++;
        syncedResultsList.push(result);
      }
    }

    // Update contest sync information
    contest.lastSyncedAt = new Date();
    contest.syncedCount = Number(contest.syncedCount || 0) + 1;
    await contest.save();

    // Audit log
    try {
      const auditLog = new AuditLog({
        action: 'RESULTS_SYNCED',
        description: `Synced results for contest ${contest.codeforcesContestName}`,
        admin: req.user?._id,
        tournament: tournamentId,
        details: {
          matched,
          unmatched,
          updated,
        },
      });

      await auditLog.save();
    } catch (auditError) {
      console.error('[syncResults] Audit log ERROR:', auditError);
    }

    console.log('[syncResults] Sync completed:', {
      total: participants.length,
      matched,
      unmatched,
      updated,
    });

    return res.json({
      success: true,
      message: 'Results synchronized successfully',
      stats: {
        total: participants.length,
        matched,
        unmatched,
        updated,
      },
      results: syncedResultsList,
      unmatchedHandles: unmatchedHandlesList,
    });
  } catch (error) {
    console.error('[syncResults] UNHANDLED ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to sync results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET LEADERBOARD
// ============================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Check if contest has ended
    const now = new Date();
    const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000);
    const isFinished = now >= endTime;

    const results = await Result.find({
      contestId,
      tournamentId,
    })
      .populate({
        path: 'participantId',
        select: 'user group seed',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      })
      .sort({ rank: 1 })
      .lean();

    // Get video submission status for each participant
    const leaderboard = await Promise.all(
      results.map(async (result, index) => {
        const videoSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: result.participantId?._id,
        });

        const isEligible = videoSubmission?.status === 'APPROVED';

        return {
          rank: result.rank || index + 1,
          participantId: result.participantId?._id,
          username: result.participantId?.user?.username || 'Unknown',
          codeforcesUsername: result.codeforcesHandle,
          group: result.participantId?.group,
          solved: result.solvedCount,
          score: result.points,
          penalty: result.penalty,
          videoStatus: videoSubmission?.status || 'NOT_SUBMITTED',
          isEligible,
          // Results only count if contest is finished AND video is approved
          isCounted: isFinished && isEligible,
        };
      })
    );

    return res.json({
      success: true,
      contestStatus: isFinished ? 'FINISHED' : 'ONGOING',
      leaderboard,
    });
  } catch (error) {
    console.error('[getLeaderboard] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// RECONCILE CONTESTS -> MATCHES
// ============================================================

exports.reconcileContestsMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({
      tournamentId,
      matchNumber: { $ne: null },
    });

    let attached = 0;

    for (const contest of contests) {
      const match = await Match.findOne({
        tournament: tournamentId,
        matchNumber: contest.matchNumber,
      });

      if (match && (!match.contest || !match.contest.equals(contest._id))) {
        match.contest = contest._id;
        await match.save();
        attached++;
      }
    }

    return res.json({
      success: true,
      message: 'Reconciled contests to matches',
      total: contests.length,
      attached,
    });
  } catch (error) {
    console.error('[reconcileContestsMatches] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reconcile contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// ADD PENALTY
// ============================================================

exports.addPenalty = async (req, res) => {
  try {
    const { contestId, participantId } = req.params;
    const { problemIndex, penalty, type = 'manual' } = req.body;

    if (!problemIndex || penalty === undefined || penalty === null) {
      return res.status(400).json({
        success: false,
        message: 'problemIndex and penalty are required',
      });
    }

    if (typeof penalty !== 'number' || penalty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Penalty must be a non-negative number',
      });
    }

    const result = await Result.findOne({
      contestId,
      participantId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found for this participant in this contest',
      });
    }

    // Find or create the problem result
    let problemResult = result.problemResults.find(
      pr => pr.problemIndex === problemIndex
    );

    if (!problemResult) {
      // Create a new problem result if it doesn't exist
      const contest = await Contest.findById(contestId);
      const problemName = `Problem ${problemIndex}`;
      
      problemResult = {
        problemIndex,
        problemName,
        points: 0,
        solved: false,
        wrongAttempts: 0,
        bestSubmissionTime: undefined,
      };
      result.problemResults.push(problemResult);
    }

    // Apply penalty
    if (type === 'manual') {
      // Manual penalty adds to wrong attempts
      problemResult.wrongAttempts = (problemResult.wrongAttempts || 0) + penalty;
    } else if (type === 'set') {
      // Set exact penalty value
      problemResult.wrongAttempts = penalty;
    } else {
      // Default: add penalty
      problemResult.wrongAttempts = (problemResult.wrongAttempts || 0) + penalty;
    }

    // Recalculate total penalty
    let totalPenalty = 0;
    for (const pr of result.problemResults) {
      if (pr.solved && pr.bestSubmissionTime) {
        totalPenalty += pr.bestSubmissionTime;
        totalPenalty += (pr.wrongAttempts || 0) * 20;
      }
    }
    result.penalty = totalPenalty;

    await result.save();

    await AuditLog.create({
      action: 'PENALTY_ADDED',
      description: `Added ${penalty} penalty to problem ${problemIndex} for participant ${participantId}`,
      admin: req.user._id,
      tournament: result.tournamentId,
      details: {
        contestId,
        participantId,
        problemIndex,
        penalty,
        type,
        newTotalPenalty: totalPenalty,
      },
    });

    return res.json({
      success: true,
      message: 'Penalty added successfully',
      result,
    });
  } catch (error) {
    console.error('[addPenalty] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to add penalty',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// UPDATE CONTEST STATUS (Helper)
// ============================================================

exports.updateContestStatus = async (req, res) => {
  try {
    const { contestId } = req.params;

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(start.getTime() + contest.durationSeconds * 1000);

    let newStatus = contest.status;
    if (now < start) {
      newStatus = 'UPCOMING';
    } else if (now >= start && now < end) {
      newStatus = 'LIVE';
    } else {
      newStatus = 'FINISHED';
    }

    if (newStatus !== contest.status) {
      contest.status = newStatus;
      await contest.save();
    }

    return res.json({
      success: true,
      contest: {
        ...contest.toObject(),
        status: newStatus,
        startTime: start,
        endTime: end,
        timeRemaining: newStatus === 'LIVE' ? Math.max(0, end - now) : null,
      },
    });
  } catch (error) {
    console.error('[updateContestStatus] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update contest status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// BULK SYNC CONTESTS
// ============================================================

exports.bulkSyncContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({
      tournamentId,
      published: true,
    });

    const results = [];
    const errors = [];

    for (const contest of contests) {
      try {
        // Check if contest has ended
        const now = new Date();
        const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000);
        
        if (now < endTime) {
          errors.push({
            contestId: contest._id,
            error: 'Contest has not ended yet',
          });
          continue;
        }

        // Sync results for this contest
        const participants = await Participant.find({
          tournamentId,
          registrationStatus: 'APPROVED',
        }).populate('user');

        const handles = participants
          .filter(p => p.user?.codeforcesUsername)
          .map(p => p.user.codeforcesUsername.trim())
          .filter(Boolean);

        if (handles.length === 0) {
          errors.push({
            contestId: contest._id,
            error: 'No participants with Codeforces handles',
          });
          continue;
        }

        const standings = await codeforcesService.getContestStandings(
          Number(contest.codeforcesContestId),
          handles
        );

        if (!standings || !standings.rows) {
          errors.push({
            contestId: contest._id,
            error: 'Failed to fetch standings',
          });
          continue;
        }

        const handleMap = new Map();
        participants.forEach((p) => {
          const handle = p.user?.codeforcesUsername;
          if (handle) {
            handleMap.set(handle.trim().toUpperCase(), p);
          }
        });

        let matched = 0;
        let updated = 0;

        for (const row of standings.rows) {
          const member = row.party?.members?.[0];
          if (!member || !member.handle) continue;

          const handle = member.handle.trim().toUpperCase();
          const participant = handleMap.get(handle);
          if (!participant) continue;

          matched++;

          const problemResults = Array.isArray(row.problemResults)
            ? row.problemResults.map((pr, index) => ({
                problemIndex: standings.problems?.[index]?.index || String.fromCharCode(65 + index),
                problemName: standings.problems?.[index]?.name || `Problem ${String.fromCharCode(65 + index)}`,
                points: pr.points || 0,
                solved: pr.points > 0,
                wrongAttempts: pr.rejectedAttemptCount || 0,
                bestSubmissionTime: pr.bestSubmissionTimeSeconds || undefined,
              }))
            : [];

          const solvedCount = problemResults.filter(p => p.solved).length;

          let totalPenalty = 0;
          for (const pr of problemResults) {
            if (pr.solved && pr.bestSubmissionTime) {
              totalPenalty += pr.bestSubmissionTime;
              totalPenalty += (pr.wrongAttempts || 0) * 20;
            }
          }

          await Result.findOneAndUpdate(
            {
              contestId: contest._id,
              participantId: participant._id,
            },
            {
              contestId: contest._id,
              tournamentId,
              participantId: participant._id,
              codeforcesHandle: member.handle,
              rank: row.rank || 0,
              points: row.points || 0,
              penalty: totalPenalty,
              solvedCount,
              problemResults,
              syncedAt: new Date(),
            },
            {
              upsert: true,
              new: true,
            }
          );

          updated++;
        }

        contest.lastSyncedAt = new Date();
        contest.syncedCount = Number(contest.syncedCount || 0) + 1;
        await contest.save();

        results.push({
          contestId: contest._id,
          name: contest.codeforcesContestName,
          matched,
          updated,
        });
      } catch (error) {
        errors.push({
          contestId: contest._id,
          error: error.message,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Bulk sync completed',
      total: contests.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[bulkSyncContests] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to bulk sync contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// DELETE CONTEST
// ============================================================

exports.deleteContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Delete associated results
    await Result.deleteMany({
      contestId,
    });

    // Delete associated video submissions
    await VideoSubmission.deleteMany({
      contestId,
    });

    // Remove contest reference from matches
    await Match.updateMany(
      { contest: contestId },
      { $unset: { contest: '' } }
    );

    // Delete the contest
    await contest.deleteOne();

    await AuditLog.create({
      action: 'CONTEST_DELETED',
      description: `Deleted contest ${contest.codeforcesContestName}`,
      admin: req.user._id,
      tournament: tournamentId,
      details: {
        contestId,
        name: contest.codeforcesContestName,
      },
    });

    return res.json({
      success: true,
      message: 'Contest deleted successfully',
    });
  } catch (error) {
    console.error('[deleteContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET CONTEST PARTICIPANTS
// ============================================================

exports.getContestParticipants = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Find participants for this contest
    let participants = [];

    if (contest.stage === 'GROUP_STAGE' && contest.group) {
      // Group stage: participants in the specific group
      participants = await Participant.find({
        tournamentId,
        group: contest.group,
        registrationStatus: 'APPROVED',
      }).populate('user', 'name username codeforcesUsername');
    } else if (contest.matchNumber) {
      // Knockout stage: participants in the match
      const match = await Match.findOne({
        tournament: tournamentId,
        matchNumber: contest.matchNumber,
      }).populate({
        path: 'participants',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      });

      if (match) {
        participants = match.participants || [];
      }
    } else {
      // All approved participants
      participants = await Participant.find({
        tournamentId,
        registrationStatus: 'APPROVED',
      }).populate('user', 'name username codeforcesUsername');
    }

    return res.json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error('[getContestParticipants] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contest participants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {
  validateCodeforcesContest: exports.validateCodeforcesContest,
  publishContest: exports.publishContest,
  getContests: exports.getContests,
  getContest: exports.getContest,
  getResults: exports.getResults,
  syncResults: exports.syncResults,
  getLeaderboard: exports.getLeaderboard,
  reconcileContestsMatches: exports.reconcileContestsMatches,
  addPenalty: exports.addPenalty,
  updateContestStatus: exports.updateContestStatus,
  bulkSyncContests: exports.bulkSyncContests,
  deleteContest: exports.deleteContest,
  getContestParticipants: exports.getContestParticipants,
};