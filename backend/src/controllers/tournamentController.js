// src/controllers/tournamentController.js
const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Result = require("../models/Result");
const mongoose = require('mongoose');
const advancementService = require("../services/advancementService");
const tournamentService = require("../services/tournamentService");
const auditLogService = require("../services/auditLogService");
const AuditLog = require('../models/AuditLog');

const getAuthenticatedUserId = (req) => {
  return req.user?.userId || req.user?.id || req.user?._id || null;
};

// ============ CREATE TOURNAMENT ============
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

    const requiredFields = [
      'name',
      'registrationStart',
      'registrationEnd',
      'tournamentStart',
      'tournamentEnd',
      'maxParticipants',
      'numberOfGroups',
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

    const errors = [];

    if (!name || !name.trim()) {
      errors.push({ field: 'name', message: 'Tournament name is required' });
    }

    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tournStart = new Date(tournamentStart);
    const tournEnd = new Date(tournamentEnd);

    if (isNaN(regStart.getTime())) {
      errors.push({ field: 'registrationStart', message: 'Invalid registration start date' });
    }
    if (isNaN(regEnd.getTime())) {
      errors.push({ field: 'registrationEnd', message: 'Invalid registration end date' });
    }
    if (isNaN(tournStart.getTime())) {
      errors.push({ field: 'tournamentStart', message: 'Invalid tournament start date' });
    }
    if (isNaN(tournEnd.getTime())) {
      errors.push({ field: 'tournamentEnd', message: 'Invalid tournament end date' });
    }

    if (regStart >= regEnd) {
      errors.push({ field: 'registrationEnd', message: 'Registration end must be after registration start' });
    }
    if (regEnd > tournStart) {
      errors.push({ field: 'tournamentStart', message: 'Tournament start must be after registration end' });
    }
    if (tournStart >= tournEnd) {
      errors.push({ field: 'tournamentEnd', message: 'Tournament end must be after tournament start' });
    }

    const maxParticipantsNum = Number(maxParticipants);
    const numberOfGroupsNum = Number(numberOfGroups);
    const qualifiersPerGroupNum = Number(qualifiersPerGroup);
    const groupContestsNum = Number(groupContests);

    if (maxParticipantsNum <= 0) {
      errors.push({ field: 'maxParticipants', message: 'Maximum participants must be greater than 0' });
    }
    if (numberOfGroupsNum <= 0) {
      errors.push({ field: 'numberOfGroups', message: 'Number of groups must be greater than 0' });
    }
    if (maxParticipantsNum % numberOfGroupsNum !== 0) {
      errors.push({ field: 'maxParticipants', message: 'Maximum participants must be divisible by number of groups' });
    }

    const calculatedParticipantsPerGroup = numberOfGroupsNum > 0 ? maxParticipantsNum / numberOfGroupsNum : 0;
    const participantsPerGroupNum = participantsPerGroup !== undefined && participantsPerGroup !== null && participantsPerGroup !== '' 
      ? Number(participantsPerGroup) 
      : calculatedParticipantsPerGroup;

    if (participantsPerGroupNum !== calculatedParticipantsPerGroup) {
      errors.push({ field: 'participantsPerGroup', message: `Participants per group must equal ${calculatedParticipantsPerGroup} (maxParticipants / numberOfGroups)` });
    }

    if (qualifiersPerGroupNum <= 0) {
      errors.push({ field: 'qualifiersPerGroup', message: 'Qualifiers per group must be greater than 0' });
    }
    if (qualifiersPerGroupNum >= participantsPerGroupNum) {
      errors.push({ field: 'qualifiersPerGroup', message: 'Qualifiers per group must be less than participants per group' });
    }
    if (groupContestsNum <= 0) {
      errors.push({ field: 'groupContests', message: 'Group contests must be greater than 0' });
    }

    const supportedFormats = ['SINGLE_ELIMINATION'];
    if (!supportedFormats.includes(playoffFormat)) {
      errors.push({ field: 'playoffFormat', message: `Playoff format must be one of: ${supportedFormats.join(', ')}` });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const normalizedName = name.trim();
    const existingTournament = await Tournament.findOne({ name: normalizedName });
    if (existingTournament) {
      return res.status(409).json({ success: false, message: 'A tournament with this name already exists' });
    }

    let slug = normalizedName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slugExists = await Tournament.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await Tournament.findOne({ slug });
      counter++;
    }

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

// ============ UPDATE TOURNAMENT ============
const validateTournamentPayload = (payload, existingTournament = null) => {
  const errors = [];

  if (payload.name !== undefined) {
    if (!payload.name || !String(payload.name).trim()) {
      errors.push({ field: 'name', message: 'Tournament name is required' });
    }
  }

  if (payload.registrationStart || payload.registrationEnd || payload.tournamentStart || payload.tournamentEnd) {
    const regStart = payload.registrationStart ? new Date(payload.registrationStart) : (existingTournament ? new Date(existingTournament.registrationStart) : null);
    const regEnd = payload.registrationEnd ? new Date(payload.registrationEnd) : (existingTournament ? new Date(existingTournament.registrationEnd) : null);
    const tournStart = payload.tournamentStart ? new Date(payload.tournamentStart) : (existingTournament ? new Date(existingTournament.tournamentStart) : null);
    const tournEnd = payload.tournamentEnd ? new Date(payload.tournamentEnd) : (existingTournament ? new Date(existingTournament.tournamentEnd) : null);

    if (regStart && regEnd && regStart >= regEnd) {
      errors.push({ field: 'registrationEnd', message: 'Registration end must be after registration start' });
    }
    if (regEnd && tournStart && regEnd > tournStart) {
      errors.push({ field: 'tournamentStart', message: 'Tournament start must be after registration end' });
    }
    if (tournStart && tournEnd && tournStart >= tournEnd) {
      errors.push({ field: 'tournamentEnd', message: 'Tournament end must be after tournament start' });
    }
  }

  if (payload.maxParticipants !== undefined || payload.numberOfGroups !== undefined) {
    const maxPart = payload.maxParticipants !== undefined ? payload.maxParticipants : (existingTournament?.maxParticipants || 20);
    const numGroups = payload.numberOfGroups !== undefined ? payload.numberOfGroups : (existingTournament?.numberOfGroups || 4);
    if (maxPart > 0 && numGroups > 0 && maxPart % numGroups !== 0) {
      errors.push({ field: 'maxParticipants', message: 'Maximum participants must be divisible by number of groups' });
    }
  }

  if (payload.qualifiersPerGroup !== undefined || payload.maxParticipants !== undefined || payload.numberOfGroups !== undefined) {
    const qualif = payload.qualifiersPerGroup !== undefined ? payload.qualifiersPerGroup : (existingTournament?.qualifiersPerGroup || 2);
    const maxPart = payload.maxParticipants !== undefined ? payload.maxParticipants : (existingTournament?.maxParticipants || 20);
    const numGroups = payload.numberOfGroups !== undefined ? payload.numberOfGroups : (existingTournament?.numberOfGroups || 4);
    const partPerGroup = maxPart / numGroups;
    if (qualif >= partPerGroup) {
      errors.push({ field: 'qualifiersPerGroup', message: 'Qualifiers per group must be less than participants per group' });
    }
  }

  return errors;
};

const updateTournament = async (req, res) => {
  try {
    const { tournamentId: id } = req.params;
    const tournamentId = id;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID is required'
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const blockedStatuses = ['GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'COMPLETED'];
    if (blockedStatuses.includes(tournament.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot edit tournament after ${tournament.status} has started`
      });
    }

    const errors = validateTournamentPayload(req.body, tournament);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (req.body.maxParticipants !== undefined) {
      const participantCount = await Participant.countDocuments({
        tournament: tournamentId
      });
      if (req.body.maxParticipants < participantCount) {
        return res.status(409).json({
          success: false,
          message: `Cannot reduce maximum participants below current count (${participantCount})`
        });
      }
    }

    const updateFields = {};
    const allowedFields = [
      'name', 'description', 'registrationStart', 'registrationEnd',
      'tournamentStart', 'tournamentEnd', 'maxParticipants', 'numberOfGroups',
      'qualifiersPerGroup', 'playoffFormat'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    if (updateFields.maxParticipants || updateFields.numberOfGroups) {
      const maxPart = updateFields.maxParticipants || tournament.maxParticipants;
      const numGroups = updateFields.numberOfGroups || tournament.numberOfGroups;
      updateFields.participantsPerGroup = maxPart / numGroups;
    }

    const updated = await Tournament.findByIdAndUpdate(
      tournamentId,
      { $set: updateFields },
      { new: true }
    ).populate('createdBy', 'name username');

    if (req.user) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'UPDATE_TOURNAMENT',
        tournament: tournamentId,
        description: `Updated tournament fields: ${Object.keys(updateFields).join(', ')}`,
        details: updateFields
      });
    }

    return res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: updated
    });

  } catch (error) {
    console.error('Update tournament error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============ GET TOURNAMENTS ============
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("createdBy", "name username")
      .sort({ createdAt: -1 });

    const tournamentsWithCount = await Promise.all(
      tournaments.map(async (t) => {
        const count = await Participant.countDocuments({ tournamentId: t._id });
        const obj = t.toObject();
        obj.participantCount = count;
        return obj;
      })
    );

    return res.status(200).json({
      success: true,
      count: tournamentsWithCount.length,
      tournaments: tournamentsWithCount,
    });
  } catch (error) {
    console.error("Get tournaments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============ GET SINGLE TOURNAMENT ============
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

    const participantCount = await Participant.countDocuments({
      tournamentId: tournament._id,
    });

    const tournamentObj = tournament.toObject();
    tournamentObj.participantCount = participantCount;

    return res.status(200).json({
      success: true,
      tournament: tournamentObj,
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

// ============ JOIN TOURNAMENT ============
const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user && req.user.role !== "PARTICIPANT") {
      return res.status(403).json({
        success: false,
        message: "Only participants can join a tournament",
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const now = new Date();
    const registrationStart = tournament.registrationStart ? new Date(tournament.registrationStart) : null;
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
    const tournamentStart = tournament.tournamentStart ? new Date(tournament.tournamentStart) : null;

    if (registrationStart && now < registrationStart) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has not started yet",
      });
    }

    if (registrationEnd && now >= registrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has ended",
      });
    }

    if (tournamentStart && now >= tournamentStart) {
      return res.status(400).json({
        success: false,
        message: "Tournament has already started",
      });
    }

    const existingParticipant = await Participant.findOne({
      tournamentId,
      user: userId,
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
        participant: existingParticipant,
      });
    }

    const participantCount = await Participant.countDocuments({ tournamentId });
    const maxParticipants = tournament.maxParticipants || 20;
    if (participantCount >= maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament full",
      });
    }

    const totalGroups = Math.max(1, Number(tournament.numberOfGroups || 4));
    const groupNames = Array.from({ length: totalGroups }, (_, index) =>
      String.fromCharCode(65 + index)
    );

    const groupCounts = await Participant.aggregate([
      {
        $match: {
          tournamentId: new mongoose.Types.ObjectId(tournamentId),
          group: { $exists: true, $ne: null, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 },
        },
      },
    ]);

    const countsByGroup = Object.fromEntries(
      groupNames.map((groupName) => [groupName, 0])
    );

    for (const entry of groupCounts) {
      countsByGroup[entry._id] = entry.count;
    }

    const targetCapacity = Math.max(
      1,
      Number(
        tournament.participantsPerGroup ||
          Math.ceil((tournament.maxParticipants || totalGroups) / totalGroups)
      )
    );

    let assignedGroup = groupNames.find(
      (groupName) => (countsByGroup[groupName] || 0) < targetCapacity
    );

    if (!assignedGroup) {
      assignedGroup = groupNames
        .slice()
        .sort((left, right) => {
          const leftCount = countsByGroup[left] || 0;
          const rightCount = countsByGroup[right] || 0;
          if (leftCount === rightCount) {
            return left.localeCompare(right);
          }
          return leftCount - rightCount;
        })[0];
    }

    const assignedSeed = (countsByGroup[assignedGroup] || 0) + 1;

    const participant = await Participant.create({
      tournamentId,
      user: userId,
      group: assignedGroup,
      seed: assignedSeed,
      status: 'ACTIVE',
      currentStage: 'REGISTRATION',
    });

    const currentGroupCount = await Participant.distinct('group', {
      tournamentId,
      group: { $ne: null, $ne: '' },
    });

    const adjustedGroupCount = currentGroupCount.length;
    if (tournament.numberOfGroups !== adjustedGroupCount) {
      tournament.numberOfGroups = Math.max(
        Number(tournament.numberOfGroups || 1),
        adjustedGroupCount
      );
      await tournament.save();
    }

    return res.status(201).json({
      success: true,
      message: "Successfully joined tournament",
      participant,
      group: {
        number: assignedGroup,
        name: `Group ${assignedGroup}`,
      },
    });
  } catch (error) {
    console.error("joinTournament error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
      });
    }
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

// ============ START TOURNAMENT ============
const startTournament = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;

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
      tournamentId: tournamentId,
    }).sort({ seed: 1, createdAt: 1 });

    const requiredParticipants = tournament.maxParticipants || 20;
    if (participants.length !== requiredParticipants) {
      return res.status(400).json({
        success: false,
        message: `Tournament requires exactly ${requiredParticipants} participants. Currently there are ${participants.length}.`,
      });
    }

    const groupSequence = Array.from({ length: Math.max(1, Number(tournament.numberOfGroups || 4)) }, (_, index) =>
      String.fromCharCode(65 + index)
    );

    const sortedParticipants = participants.map((participant, index) => {
      if (!participant.group) {
        participant.group = groupSequence[index % groupSequence.length];
      }
      if (!participant.seed || participant.seed < 1) {
        participant.seed = index + 1;
      }
      participant.status = 'ACTIVE';
      participant.currentStage = 'GROUP_STAGE';
      return participant;
    });

    for (const participant of sortedParticipants) {
      await participant.save();
    }

    tournament.status = 'GROUP_STAGE';
    tournament.currentStage = 'GROUP_STAGE';
    await tournament.save();

    try {
      await auditLogService.record({
        action: "TOURNAMENT_STARTED",
        description: "Started tournament and generated groups",
        admin: getAuthenticatedUserId(req),
        tournament: tournament._id,
        metadata: {
          participantCount: participants.length,
          groups: groupSequence,
        },
      });
    } catch (auditError) {
      console.error("Tournament start audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Tournament started successfully",
      tournament,
      groups: groupSequence,
    });
  } catch (error) {
    console.error("Start tournament error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============ GET BRACKET ============
const getBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const bracket = await tournamentService.getBracket(tournamentId);
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

// ============ GET LEADERBOARD ============
const getLeaderboard = async (req, res) => {
  try {
     const tournamentId = req.params.tournamentId || req.params.id; // ✅ added fallback

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({
      tournamentId: tournamentId,
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
          currentStage: participant.currentStage || null,
          status: participant.status || null,
          rank: null,
          latestRank: latestResult?.rank ?? null,
          solved: latestResult?.solvedCount ?? 0,
          score: latestResult?.points ?? 0,
          penalty: latestResult?.penalty ?? 0,
          winRate: participant.status === "CHAMPION" ? 100 : null,
          latestResult,
        };
      })
    );

    const grouped = {};
    for (const entry of leaderboard) {
      if (!entry.group) continue;
      if (!grouped[entry.group]) grouped[entry.group] = [];
      grouped[entry.group].push(entry);
    }

    for (const entries of Object.values(grouped)) {
      entries.sort((a, b) => {
        const scoreA = Number(a.score || 0);
        const scoreB = Number(b.score || 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        const solvedA = Number(a.solved || 0);
        const solvedB = Number(b.solved || 0);
        if (solvedA !== solvedB) return solvedB - solvedA;
        const penaltyA = Number(a.penalty || 0);
        const penaltyB = Number(b.penalty || 0);
        return penaltyA - penaltyB;
      });
      entries.forEach((entry, index) => {
        entry.groupRank = index + 1;
      });
    }

    leaderboard.sort((a, b) => {
      const scoreA = Number(a.score || 0);
      const scoreB = Number(b.score || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      const solvedA = Number(a.solved || 0);
      const solvedB = Number(b.solved || 0);
      if (solvedA !== solvedB) return solvedB - solvedA;
      const penaltyA = Number(a.penalty || 0);
      const penaltyB = Number(b.penalty || 0);
      if (penaltyA !== penaltyB) return penaltyA - penaltyB;
      return Number(a.seed || 9999) - Number(b.seed || 9999);
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
        currentStage: tournament.currentStage,
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

// ============ ADVANCE FUNCTIONS ============
const advanceGroupStage = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const advancing = await advancementService.advanceGroupStage(tournamentId);

    await auditLogService.record({
      action: "GROUP_STAGE_ADVANCED",
      description: "Advanced group-stage qualifiers to quarter finals",
      admin: getAuthenticatedUserId(req),
      tournament: tournamentId,
    });

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

const advanceQuarterFinal = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const advancing = await advancementService.advanceQuarterFinal(tournamentId);

    await auditLogService.record({
      action: "QUARTER_FINAL_ADVANCED",
      description: "Advanced quarter-final winners to semi finals",
      admin: getAuthenticatedUserId(req),
      tournament: tournamentId,
    });

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

const advanceSemiFinal = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const advancing = await advancementService.advanceSemiFinal(tournamentId);

    await auditLogService.record({
      action: "SEMI_FINAL_ADVANCED",
      description: "Advanced semi-final winners to the final",
      admin: getAuthenticatedUserId(req),
      tournament: tournamentId,
    });

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

const completeTournament = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const winnerId = await advancementService.completeTournament(tournamentId);

    await auditLogService.record({
      action: "TOURNAMENT_COMPLETED",
      description: "Completed tournament and crowned champion",
      admin: getAuthenticatedUserId(req),
      tournament: tournamentId,
      metadata: { champion: winnerId },
    });

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

const advanceStage = async (req, res) => {
  const stage = String(req.body.stage || "").trim().toLowerCase(); // ✅ changed from req.params.stage
  try {
    switch (stage) {
      case "group-stage":
      case "group_stage":
      case "groups":
      case "group":
        return await advanceGroupStage(req, res);
      case "qf":
      case "quarter-final":
      case "quarter_final":
      case "quarterfinal":
        return await advanceQuarterFinal(req, res);
      case "sf":
      case "semi-final":
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
          message: "Invalid stage. Supported: group-stage, qf, sf, complete"
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

// ============ GET PARTICIPANTS ============
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
      tournamentId: tournamentId,
    })
      .populate('user', 'name username email codeforcesUsername')
      .sort({ group: 1, seed: 1 });

    return res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error("Get participants error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============ EXPORTS ============
module.exports = {
  createTournament,
  updateTournament,
  getTournaments,
  getTournament,
  joinTournament,
  startTournament,
  getBracket,
  getLeaderboard,
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
  advanceStage,
  advanceTournament: advanceStage,
  getParticipants,
};