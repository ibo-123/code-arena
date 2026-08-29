const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Result = require("../models/Result");

const advancementService = require("../services/advancementService");
const tournamentService = require("../services/tournamentService");
const auditLogService = require("../services/auditLogService");

/**
 * Safely get the authenticated admin/user ID.
 * Different auth middleware implementations sometimes expose
 * the authenticated user as req.user.userId or req.user.id.
 */
const getAuthenticatedUserId = (req) => {
  return req.user?.userId || req.user?.id || req.user?._id || null;
};

/**
 * CREATE TOURNAMENT
 *
 * POST /api/tournaments
 */
const createTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      registrationStart,
      registrationEnd,
      tournamentStart,
      tournamentEnd,
      maxParticipants,
      numberOfGroups,
      participantsPerGroup,
      qualifiersPerGroup,
      groupContests,
      playoffFormat
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'name',
      'registrationStart',
      'registrationEnd',
      'tournamentStart',
      'tournamentEnd',
      'maxParticipants',
      'numberOfGroups',
      'participantsPerGroup',
      'qualifiersPerGroup',
      'groupContests',
      'playoffFormat'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errors: missingFields.map(field => ({
          field,
          message: `${field} is required`
        }))
      });
    }

    // Validation object
    const errors = [];

    // Name validation
    if (!name || !name.trim()) {
      errors.push({
        field: 'name',
        message: 'Tournament name is required'
      });
    }

    // Date validations
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tournStart = new Date(tournamentStart);
    const tournEnd = new Date(tournamentEnd);

    if (isNaN(regStart.getTime())) {
      errors.push({
        field: 'registrationStart',
        message: 'Invalid registration start date'
      });
    }

    if (isNaN(regEnd.getTime())) {
      errors.push({
        field: 'registrationEnd',
        message: 'Invalid registration end date'
      });
    }

    if (isNaN(tournStart.getTime())) {
      errors.push({
        field: 'tournamentStart',
        message: 'Invalid tournament start date'
      });
    }

    if (isNaN(tournEnd.getTime())) {
      errors.push({
        field: 'tournamentEnd',
        message: 'Invalid tournament end date'
      });
    }

    // Date order validations
    if (regStart >= regEnd) {
      errors.push({
        field: 'registrationEnd',
        message: 'Registration end must be after registration start'
      });
    }

    if (regEnd > tournStart) {
      errors.push({
        field: 'tournamentStart',
        message: 'Tournament start must be after registration end'
      });
    }

    if (tournStart >= tournEnd) {
      errors.push({
        field: 'tournamentEnd',
        message: 'Tournament end must be after tournament start'
      });
    }

    // Numeric validations
    const maxParticipantsNum = Number(maxParticipants);
    const numberOfGroupsNum = Number(numberOfGroups);
    const participantsPerGroupNum = Number(participantsPerGroup);
    const qualifiersPerGroupNum = Number(qualifiersPerGroup);
    const groupContestsNum = Number(groupContests);

    if (maxParticipantsNum <= 0) {
      errors.push({
        field: 'maxParticipants',
        message: 'Maximum participants must be greater than 0'
      });
    }

    if (numberOfGroupsNum <= 0) {
      errors.push({
        field: 'numberOfGroups',
        message: 'Number of groups must be greater than 0'
      });
    }

    if (maxParticipantsNum % numberOfGroupsNum !== 0) {
      errors.push({
        field: 'maxParticipants',
        message: 'Maximum participants must be divisible by number of groups'
      });
    }

    const calculatedParticipantsPerGroup = maxParticipantsNum / numberOfGroupsNum;
    if (participantsPerGroupNum !== calculatedParticipantsPerGroup) {
      errors.push({
        field: 'participantsPerGroup',
        message: `Participants per group must equal ${calculatedParticipantsPerGroup} (maxParticipants / numberOfGroups)`
      });
    }

    if (qualifiersPerGroupNum <= 0) {
      errors.push({
        field: 'qualifiersPerGroup',
        message: 'Qualifiers per group must be greater than 0'
      });
    }

    if (qualifiersPerGroupNum >= participantsPerGroupNum) {
      errors.push({
        field: 'qualifiersPerGroup',
        message: 'Qualifiers per group must be less than participants per group'
      });
    }

    if (groupContestsNum <= 0) {
      errors.push({
        field: 'groupContests',
        message: 'Group contests must be greater than 0'
      });
    }

    // Playoff format validation
    const supportedFormats = ['SINGLE_ELIMINATION'];
    if (!supportedFormats.includes(playoffFormat)) {
      errors.push({
        field: 'playoffFormat',
        message: `Playoff format must be one of: ${supportedFormats.join(', ')}`
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check for duplicate tournament name
    const normalizedName = name.trim();
    const existingTournament = await Tournament.findOne({
      name: normalizedName,
    });

    if (existingTournament) {
      return res.status(409).json({
        success: false,
        message: 'A tournament with this name already exists',
      });
    }

    // Generate unique slug
    let slug = normalizedName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure unique slug
    let slugExists = await Tournament.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await Tournament.findOne({ slug });
      counter++;
    }

    // Create tournament with DRAFT status
    const tournament = await Tournament.create({
      name: normalizedName,
      slug,
      description: description?.trim() || "",
      registrationStart: regStart,
      registrationEnd: regEnd,
      tournamentStart: tournStart,
      tournamentEnd: tournEnd,
      maxParticipants: maxParticipantsNum,
      numberOfGroups: numberOfGroupsNum,
      participantsPerGroup: participantsPerGroupNum,
      qualifiersPerGroup: qualifiersPerGroupNum,
      groupContests: groupContestsNum,
      playoffFormat,
      status: 'DRAFT',
      createdBy: getAuthenticatedUserId(req),
    });

    // Audit log
    try {
      await auditLogService.record({
        action: "TOURNAMENT_CREATED",
        description: `Created tournament ${tournament.name}`,
        admin: getAuthenticatedUserId(req),
        tournament: tournament._id,
      });
    } catch (auditError) {
      console.error("Tournament audit log error:", auditError);
    }

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    console.error("Create tournament error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * GET ALL TOURNAMENTS
 *
 * GET /api/tournaments
 */
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("createdBy", "name username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    console.error("Get tournaments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * GET SINGLE TOURNAMENT
 *
 * GET /api/tournaments/:id
 */
const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("createdBy", "name username");

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    return res.status(200).json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error("Get tournament error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * JOIN TOURNAMENT
 *
 * POST /api/tournaments/:id/join
 *
 * This creates a Participant record for the authenticated user.
 */
const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Tournament is not accepting participants",
      });
    }

    const existingParticipant = await Participant.findOne({
      tournament: tournamentId,
      user: userId,
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this tournament",
        participant: existingParticipant,
      });
    }

    const participantCount = await Participant.countDocuments({
      tournament: tournamentId,
    });

    const maxParticipants = tournament.maxParticipants || 20;

    if (participantCount >= maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament is full",
      });
    }

    const participant = await Participant.create({
      tournament: tournamentId,
      user: userId,
      status: "REGISTERED",
      currentRound: "REGISTRATION",
    });

    return res.status(201).json({
      success: true,
      message: "Successfully joined tournament",
      participant,
    });
  } catch (error) {
    console.error("Join tournament error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this tournament",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * START TOURNAMENT
 *
 * POST /api/tournaments/:id/start
 *
 * Requirements:
 * - Tournament must be in REGISTRATION
 * - Exactly 20 participants
 * - Participants are randomly distributed into A-D
 * - 5 participants per group
 */
const startTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Tournament has already started",
      });
    }

    const participants = await Participant.find({
      tournament: tournamentId,
    });

    const requiredParticipants = tournament.maxParticipants || 20;

    if (participants.length !== requiredParticipants) {
      return res.status(400).json({
        success: false,
        message: `Tournament requires exactly ${requiredParticipants} participants. Currently there are ${participants.length}.`,
      });
    }

    const groups = ["A", "B", "C", "D"];

    const shuffled = [...participants];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (let i = 0; i < shuffled.length; i += 1) {
      const participant = shuffled[i];

      const groupIndex = Math.floor(i / 5);
      const seed = i + 1;

      participant.group = groups[groupIndex];
      participant.seed = seed;
      participant.status = "ACTIVE";
      participant.currentRound = "GROUP_STAGE";

      await participant.save();
    }

    tournament.status = "GROUP_STAGE";
    tournament.currentRound = "GROUP_STAGE";

    await tournament.save();

    try {
      await auditLogService.record({
        action: "TOURNAMENT_STARTED",
        description: "Started tournament and generated groups A-D",
        admin: getAuthenticatedUserId(req),
        tournament: tournament._id,
        metadata: {
          participantCount: participants.length,
          groups,
        },
      });
    } catch (auditError) {
      console.error("Tournament start audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Tournament started successfully",
      tournament,
      groups,
    });
  } catch (error) {
    console.error("Start tournament error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * GET TOURNAMENT BRACKET
 *
 * GET /api/tournaments/:id/bracket
 */
const getBracket = async (req, res) => {
  try {
    const bracket = await tournamentService.getBracket(req.params.id);

    return res.status(200).json({
      success: true,
      bracket,
    });
  } catch (error) {
    console.error("Get bracket error:", error);

    if (error.message === "Tournament not found") {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * GET TOURNAMENT LEADERBOARD
 *
 * GET /api/tournaments/:id/leaderboard
 *
 * The leaderboard is based on the latest ContestResult
 * belonging to this tournament's participants.
 */
const getLeaderboard = async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({
      tournament: tournamentId,
    })
      .populate("user", "name username codeforcesUsername")
      .sort({ seed: 1 });

    const leaderboard = await Promise.all(
      participants.map(async (participant) => {
        const latestResult = await Result.findOne({
          participantId: participant._id,
        })
          .sort({ syncedAt: -1 })
          .populate("contestId", "name round group tournament codeforcesContestId");

        return {
          participantId: participant._id,
          username: participant.user?.username || participant.user?.name || 'Unknown',
          name: participant.user?.name,
          codeforcesUsername: participant.user?.codeforcesUsername || '',
          group: participant.group || null,
          seed: participant.seed || 9999,
          groupRank: null,
          currentRound: participant.currentRound || null,
          status: participant.status || null,

          rank: null,
          latestRank: latestResult?.rank ?? null,
          solved: latestResult?.solvedCount ?? 0,
          score: latestResult?.points ?? 0,
          penalty: latestResult?.penalty ?? 0,

          winRate:
            participant.status === "CHAMPION"
              ? 100
              : null,

          latestResult,
        };
      })
    );

    /**
     * Calculate rank inside each group.
     */
    const grouped = {};

    for (const entry of leaderboard) {
      if (!entry.group) {
        continue;
      }

      if (!grouped[entry.group]) {
        grouped[entry.group] = [];
      }

      grouped[entry.group].push(entry);
    }

    for (const entries of Object.values(grouped)) {
      entries.sort((a, b) => {
        const scoreA = Number(a.score || 0);
        const scoreB = Number(b.score || 0);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        const solvedA = Number(a.solved || 0);
        const solvedB = Number(b.solved || 0);

        if (solvedA !== solvedB) {
          return solvedB - solvedA;
        }

        const penaltyA = Number(a.penalty || 0);
        const penaltyB = Number(b.penalty || 0);

        return penaltyA - penaltyB;
      });

      entries.forEach((entry, index) => {
        entry.groupRank = index + 1;
      });
    }

    /**
     * Overall ranking.
     */
    leaderboard.sort((a, b) => {
      const scoreA = Number(a.score || 0);
      const scoreB = Number(b.score || 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const solvedA = Number(a.solved || 0);
      const solvedB = Number(b.solved || 0);

      if (solvedA !== solvedB) {
        return solvedB - solvedA;
      }

      const penaltyA = Number(a.penalty || 0);
      const penaltyB = Number(b.penalty || 0);

      if (penaltyA !== penaltyB) {
        return penaltyA - penaltyB;
      }

      return Number(a.seed || 9999) -
        Number(b.seed || 9999);
    });

    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return res.status(200).json({
      success: true,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        currentRound: tournament.currentRound,
      },
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("Tournament leaderboard error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * ADVANCE GROUP STAGE
 *
 * POST /api/tournaments/:id/advance/group-stage
 */
const advanceGroupStage = async (req, res) => {
  try {
    const advancing = await advancementService.advanceGroupStage(
      req.params.id
    );

    try {
      await auditLogService.record({
        action: "GROUP_STAGE_ADVANCED",
        description:
          "Advanced group-stage qualifiers to quarter finals",
        admin: getAuthenticatedUserId(req),
        tournament: req.params.id,
      });
    } catch (auditError) {
      console.error("Group advancement audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Advanced to Quarter Finals",
      advancing,
    });
  } catch (error) {
    console.error("Advance group stage error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ADVANCE QUARTER FINAL
 *
 * POST /api/tournaments/:id/advance/qf
 */
const advanceQuarterFinal = async (req, res) => {
  try {
    const advancing = await advancementService.advanceQuarterFinal(
      req.params.id
    );

    try {
      await auditLogService.record({
        action: "QUARTER_FINAL_ADVANCED",
        description:
          "Advanced quarter-final winners to semi finals",
        admin: getAuthenticatedUserId(req),
        tournament: req.params.id,
      });
    } catch (auditError) {
      console.error("Quarter final audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Advanced to Semi Finals",
      advancing,
    });
  } catch (error) {
    console.error("Advance quarter final error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ADVANCE SEMI FINAL
 *
 * POST /api/tournaments/:id/advance/sf
 */
const advanceSemiFinal = async (req, res) => {
  try {
    const advancing = await advancementService.advanceSemiFinal(
      req.params.id
    );

    try {
      await auditLogService.record({
        action: "SEMI_FINAL_ADVANCED",
        description:
          "Advanced semi-final winners to the final",
        admin: getAuthenticatedUserId(req),
        tournament: req.params.id,
      });
    } catch (auditError) {
      console.error("Semi final audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Advanced to Final",
      advancing,
    });
  } catch (error) {
    console.error("Advance semi final error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * COMPLETE TOURNAMENT
 *
 * POST /api/tournaments/:id/advance/complete
 */
const completeTournament = async (req, res) => {
  try {
    const winnerId = await advancementService.completeTournament(
      req.params.id
    );

    try {
      await auditLogService.record({
        action: "TOURNAMENT_COMPLETED",
        description:
          "Completed tournament and crowned champion",
        admin: getAuthenticatedUserId(req),
        tournament: req.params.id,
        metadata: {
          champion: winnerId,
        },
      });
    } catch (auditError) {
      console.error("Tournament completion audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Tournament completed",
      winnerId,
    });
  } catch (error) {
    console.error("Complete tournament error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GENERIC ADVANCE STAGE
 *
 * POST /api/tournaments/:id/advance/:stage
 *
 * This supports the API structure described in your project README:
 *
 * /advance/group-stage
 * /advance/qf
 * /advance/sf
 * /advance/complete
 *
 * It also makes the controller compatible with a route that expects
 * `advanceStage`.
 */
const advanceStage = async (req, res) => {
  const stage = String(req.params.stage || "")
    .trim()
    .toLowerCase();

  try {
    switch (stage) {
      case "group-stage":
      case "group_stage":
      case "groups":
      case "group":
        return await advanceGroupStage(req, res);

      case "qf":
      case "quarter-final":
      case "quarter-final-stage":
      case "quarter_final":
      case "quarterfinal":
        return await advanceQuarterFinal(req, res);

      case "sf":
      case "semi-final":
      case "semi-final-stage":
      case "semi_final":
      case "semifinal":
        return await advanceSemiFinal(req, res);

      case "complete":
      case "final":
      case "champion":
        return await completeTournament(req, res);

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid tournament stage. Supported stages: group-stage, qf, sf, complete",
        });
    }
  } catch (error) {
    console.error("Advance stage error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET PARTICIPANTS
 *
 * GET /api/tournaments/:tournamentId/participants
 */
const getParticipants = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const participants = await Participant.find({
      tournament: tournamentId,
    })
      .populate(
        'user',
        'name username email codeforcesUsername'
      )
      .sort({
        group: 1,
        seed: 1,
      });

    return res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error('Get participants error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET GROUPS
 *
 * GET /api/tournaments/:tournamentId/groups
 */
const getGroups = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const participants = await Participant.find({
      tournament: tournamentId,
    })
      .populate(
        'user',
        'name username codeforcesUsername'
      )
      .sort({
        group: 1,
        seed: 1,
      });

    const groups = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

    for (const participant of participants) {
      if (participant.group && groups[participant.group]) {
        groups[participant.group].push(participant);
      }
    }

    return res.status(200).json({
      success: true,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        currentRound: tournament.currentRound,
      },
      groups,
    });
  } catch (error) {
    console.error('Get groups error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * ADVANCE TOURNAMENT
 *
 * POST /api/tournaments/:tournamentId/advance
 */
const advanceTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const stage =
      req.body?.stage ||
      req.query?.stage;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message:
          'Stage is required. Use group-stage, qf, sf, or complete.',
      });
    }

    const normalizedStage = String(stage)
      .trim()
      .toLowerCase();

    let result;

    switch (normalizedStage) {
      case 'group-stage':
      case 'group_stage':
      case 'groups':
      case 'group':
        result =
          await advancementService.advanceGroupStage(
            tournamentId
          );
        break;

      case 'qf':
      case 'quarter-final':
      case 'quarter_final':
      case 'quarterfinal':
        result =
          await advancementService.advanceQuarterFinal(
            tournamentId
          );
        break;

      case 'sf':
      case 'semi-final':
      case 'semi_final':
      case 'semifinal':
        result =
          await advancementService.advanceSemiFinal(
            tournamentId
          );
        break;

      case 'complete':
      case 'final':
        result =
          await advancementService.completeTournament(
            tournamentId
          );
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            'Invalid stage. Supported stages: group-stage, qf, sf, complete.',
        });
    }

    try {
      await auditLogService.record({
        action: 'TOURNAMENT_STAGE_ADVANCED',
        description: `Advanced tournament to ${normalizedStage}`,
        admin: getAuthenticatedUserId(req),
        tournament: tournamentId,
        metadata: {
          stage: normalizedStage,
        },
      });
    } catch (auditError) {
      console.error(
        'Advance audit log error:',
        auditError
      );
    }

    return res.status(200).json({
      success: true,
      message: `Tournament advanced successfully to ${normalizedStage}`,
      stage: normalizedStage,
      result,
    });
  } catch (error) {
    console.error(
      'Advance tournament error:',
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * EXPORT CONTROLLERS
 */
module.exports = {
  createTournament,
  getTournaments,
  getTournament,

  joinTournament,

  getParticipants,
  getGroups,

  startTournament,

  getBracket,
  getLeaderboard,

  advanceTournament,

  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
};
