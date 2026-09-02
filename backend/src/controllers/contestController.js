const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Tournament = require('../models/Tournament');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const Match = require('../models/Match');

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

    const id = parseInt(contestId, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const result = await codeforcesService.validateContest(id);

    if (!result.valid) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Contest not found',
      });
    }

    return res.json({
      success: true,
      contest: {
        id: result.contest.id,
        name: result.contest.name,
        type: result.contest.type,
        phase: result.contest.phase,
        startTime: new Date(
          result.contest.startTimeSeconds * 1000
        ),
        durationSeconds: result.contest.durationSeconds,
        url: codeforcesService.formatContestUrl(
          result.contest.id
        ),
      },
    });
  } catch (error) {
    console.error(
      '[validateCodeforcesContest] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to validate contest',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
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

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!codeforcesContestId || !stage) {
      return res.status(400).json({
        success: false,
        message:
          'Codeforces contest ID and stage are required',
      });
    }

    const tournament = await Tournament.findById(
      tournamentId
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const validation =
      await codeforcesService.validateContest(
        codeforcesContestId
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message:
          validation.error ||
          'Invalid Codeforces contest',
      });
    }

    const existing = await Contest.findOne({
      tournamentId,
      codeforcesContestId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'Contest already published to this tournament',
      });
    }

    const contest = new Contest({
      tournamentId,

      codeforcesContestId:
        validation.contest.id,

      codeforcesContestName:
        validation.contest.name,

      codeforcesUrl:
        codeforcesService.formatContestUrl(
          validation.contest.id
        ),

      type: validation.contest.type,

      phase: validation.contest.phase,

      startTime: new Date(
        validation.contest.startTimeSeconds * 1000
      ),

      durationSeconds:
        validation.contest.durationSeconds,

      stage,

      group:
        stage === 'GROUP_STAGE'
          ? group
          : undefined,

      matchNumber:
        stage !== 'GROUP_STAGE'
          ? matchNumber
          : undefined,

      status: 'UPCOMING',

      published: true,

      publishedAt: new Date(),
    });

    await contest.save();

    // Attach knockout contest to Match
    if (
      stage !== 'GROUP_STAGE' &&
      matchNumber !== undefined &&
      matchNumber !== null
    ) {
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
        console.error(
          '[publishContest] Failed to attach match:',
          error
        );
      }
    }

    const auditLog = new AuditLog({
      action: 'CONTEST_PUBLISHED',

      description:
        `Published contest ${validation.contest.name} ` +
        `(${validation.contest.id})`,

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
    console.error(
      '[publishContest] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to publish contest',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET CONTESTS
// ============================================================

exports.getContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
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

    return res.json({
      success: true,
      contests,
    });
  } catch (error) {
    console.error(
      '[getContests] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET SINGLE CONTEST
// ============================================================

exports.getContest = async (req, res) => {
  try {
    const {
      tournamentId,
      contestId,
    } = req.params;

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (
      !contestId ||
      !mongoose.Types.ObjectId.isValid(contestId)
    ) {
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

    return res.json({
      success: true,
      contest,
    });
  } catch (error) {
    console.error(
      '[getContest] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to get contest',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET RESULTS
// ============================================================

exports.getResults = async (req, res) => {
  try {
    const {
      tournamentId,
      contestId,
    } = req.params;

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (
      !contestId ||
      !mongoose.Types.ObjectId.isValid(contestId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const results = await Result.find({
      contestId,
      tournamentId,
    })
      .populate({
        path: 'participantId',
        select: 'group seed user',
        populate: {
          path: 'user',
          select:
            'name username codeforcesUsername',
        },
      })
      .sort({ rank: 1 })
      .lean();

    const normalized = results.map((r) => ({
      ...r,
      participant: r.participantId,
      score: r.points,
      solved: r.solvedCount,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      results: normalized,
    });
  } catch (error) {
    console.error(
      '[getResults] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// SYNC RESULTS
// ============================================================

exports.syncResults = async (req, res) => {
  try {
    const {
      tournamentId,
      contestId,
    } = req.params;

    console.log(
      '[syncResults] Starting sync',
      {
        tournamentId,
        contestId,
      }
    );

    // --------------------------------------------------------
    // Validate IDs
    // --------------------------------------------------------

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (
      !contestId ||
      !mongoose.Types.ObjectId.isValid(contestId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    // --------------------------------------------------------
    // Find contest
    // --------------------------------------------------------

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

    console.log(
      '[syncResults] Contest found:',
      {
        id: contest._id.toString(),
        codeforcesContestId:
          contest.codeforcesContestId,
        name: contest.codeforcesContestName,
      }
    );

    if (!contest.codeforcesContestId) {
      return res.status(400).json({
        success: false,
        message:
          'This contest does not have a Codeforces contest ID',
      });
    }

    // --------------------------------------------------------
    // Find tournament participants
    // --------------------------------------------------------

    const allParticipants =
      await Participant.find({
        tournamentId,
      }).populate('user');

    console.log(
      '[syncResults] Participants found:',
      allParticipants.length
    );

    const participants =
      allParticipants.filter(
        (participant) =>
          participant.user &&
          typeof participant.user.codeforcesUsername ===
            'string' &&
          participant.user.codeforcesUsername.trim() !== ''
      );

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No participants with Codeforces handles found',
      });
    }

    // --------------------------------------------------------
    // Prepare handles
    // --------------------------------------------------------

    const handles = participants
      .map(
        (participant) =>
          participant.user.codeforcesUsername.trim()
      )
      .filter(Boolean);

    console.log(
      '[syncResults] Codeforces handles:',
      handles
    );

    // --------------------------------------------------------
    // Fetch Codeforces standings
    // --------------------------------------------------------

    console.log(
      '[syncResults] Fetching Codeforces standings...',
      contest.codeforcesContestId
    );

    let standings;

    try {
      standings =
        await codeforcesService.getContestStandings(
          Number(contest.codeforcesContestId),
          handles
        );
    } catch (error) {
      console.error(
        '[syncResults] Codeforces standings ERROR:',
        error
      );

      return res.status(502).json({
        success: false,
        message:
          'Failed to fetch standings from Codeforces',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : undefined,
      });
    }

    // --------------------------------------------------------
    // Validate standings response
    // --------------------------------------------------------

    if (!standings) {
      return res.status(502).json({
        success: false,
        message:
          'Codeforces returned an empty standings response',
      });
    }

    if (!Array.isArray(standings.rows)) {
      console.error(
        '[syncResults] Invalid standings:',
        standings
      );

      return res.status(502).json({
        success: false,
        message:
          'Invalid standings response from Codeforces',
      });
    }

    console.log(
      '[syncResults] Standings rows:',
      standings.rows.length
    );

    // --------------------------------------------------------
    // Create participant handle map
    // --------------------------------------------------------

    const handleMap = new Map();

    participants.forEach((participant) => {
      const handle =
        participant.user?.codeforcesUsername;

      if (handle) {
        handleMap.set(
          handle.trim().toUpperCase(),
          participant
        );
      }
    });

    // --------------------------------------------------------
    // Process standings
    // --------------------------------------------------------

    let matched = 0;
    let unmatched = 0;
    let updated = 0;

    const syncedResultsList = [];
    const unmatchedHandlesList = [];

    for (const row of standings.rows) {
      const member =
        row.party?.members?.[0];

      if (!member || !member.handle) {
        continue;
      }

      const handle =
        member.handle.trim().toUpperCase();

      const participant =
        handleMap.get(handle);

      if (!participant) {
        unmatched++;

        unmatchedHandlesList.push(
          member.handle
        );

        continue;
      }

      matched++;

      const problemResults =
        Array.isArray(row.problemResults)
          ? row.problemResults.map(
              (problemResult, index) => {
                const problem =
                  standings.problems?.[index];

                const problemIndex =
                  problem?.index ||
                  String.fromCharCode(
                    65 + index
                  );

                const problemName =
                  problem?.name ||
                  `Problem ${String.fromCharCode(
                    65 + index
                  )}`;

                return {
                  problemIndex,
                  problemName,
                  points:
                    problemResult.points || 0,
                  solved:
                    problemResult.points > 0,
                  wrongAttempts:
                    problemResult.rejectedAttemptCount ||
                    0,
                  bestSubmissionTime:
                    problemResult.bestSubmissionTimeSeconds ||
                    undefined,
                };
              }
            )
          : [];

      const solvedCount =
        problemResults.filter(
          (problem) => problem.solved
        ).length;

      const result =
        await Result.findOneAndUpdate(
          {
            contestId,
            participantId:
              participant._id,
          },
          {
            contestId,
            tournamentId,
            participantId:
              participant._id,

            codeforcesHandle:
              member.handle,

            rank:
              row.rank || 0,

            points:
              row.points || 0,

            penalty:
              row.penalty || 0,

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

        syncedResultsList.push(
          result
        );
      }
    }

    // --------------------------------------------------------
    // Update contest sync information
    // --------------------------------------------------------

    contest.lastSyncedAt = new Date();

    contest.syncedCount =
      Number(contest.syncedCount || 0) + 1;

    await contest.save();

    // --------------------------------------------------------
    // Audit log
    // --------------------------------------------------------

    try {
      const auditLog = new AuditLog({
        action: 'RESULTS_SYNCED',

        description:
          `Synced results for contest ` +
          `${contest.codeforcesContestName}`,

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
      // Audit logging should not make an otherwise
      // successful synchronization fail.
      console.error(
        '[syncResults] Audit log ERROR:',
        auditError
      );
    }

    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    console.log(
      '[syncResults] Sync completed:',
      {
        total: participants.length,
        matched,
        unmatched,
        updated,
      }
    );

    return res.json({
      success: true,

      message:
        'Results synchronized successfully',

      stats: {
        total: participants.length,
        matched,
        unmatched,
        updated,
      },

      results:
        syncedResultsList,

      unmatchedHandles:
        unmatchedHandlesList,
    });
  } catch (error) {
    console.error(
      '================================================'
    );

    console.error(
      '[syncResults] UNHANDLED ERROR'
    );

    console.error(error);

    console.error(
      '================================================'
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to sync results',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET LEADERBOARD
// ============================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const {
      tournamentId,
      contestId,
    } = req.params;

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (
      !contestId ||
      !mongoose.Types.ObjectId.isValid(contestId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const results = await Result.find({
      contestId,
      tournamentId,
    })
      .populate(
        'participantId',
        'user group seed'
      )
      .sort({ rank: 1 })
      .lean();

    const leaderboard = results.map(
      (result, index) => ({
        rank:
          result.rank || index + 1,

        participantId:
          result.participantId?._id,

        username:
          result.participantId?.user
            ?.username || 'Unknown',

        codeforcesUsername:
          result.codeforcesHandle,

        group:
          result.participantId?.group,

        solved:
          result.solvedCount,

        score:
          result.points,

        penalty:
          result.penalty,
      })
    );

    return res.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error(
      '[getLeaderboard] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// RECONCILE CONTESTS -> MATCHES
// ============================================================

exports.reconcileContestsMatches = async (
  req,
  res
) => {
  try {
    const { tournamentId } =
      req.params;

    if (
      !tournamentId ||
      !mongoose.Types.ObjectId.isValid(tournamentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests =
      await Contest.find({
        tournamentId,
        matchNumber: {
          $ne: null,
        },
      });

    let attached = 0;

    for (const contest of contests) {
      const match =
        await Match.findOne({
          tournament: tournamentId,
          matchNumber:
            contest.matchNumber,
        });

      if (
        match &&
        (
          !match.contest ||
          !match.contest.equals(
            contest._id
          )
        )
      ) {
        match.contest =
          contest._id;

        await match.save();

        attached++;
      }
    }

    return res.json({
      success: true,
      message:
        'Reconciled contests to matches',
      total: contests.length,
      attached,
    });
  } catch (error) {
    console.error(
      '[reconcileContestsMatches] ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to reconcile contests',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};
