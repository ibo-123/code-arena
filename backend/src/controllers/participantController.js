const mongoose = require("mongoose");
const Participant = require("../models/Participant");
const Tournament = require("../models/Tournament");
const AuditLog = require("../models/AuditLog");

const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const userId = req.user.userId || req.user._id;

    // Only participants can register
    if (req.user.role !== "PARTICIPANT") {
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

    const registrationStart = tournament.registrationStart
      ? new Date(tournament.registrationStart)
      : null;

    const registrationEnd = tournament.registrationEnd
      ? new Date(tournament.registrationEnd)
      : null;

    const tournamentStart = tournament.tournamentStart
      ? new Date(tournament.tournamentStart)
      : tournament.startDate
        ? new Date(tournament.startDate)
        : null;

    /*
     * ---------------------------------------------------------
     * REGISTRATION TIME VALIDATION
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * TOURNAMENT CAPACITY
     * ---------------------------------------------------------
     */

    const participantCount = await Participant.countDocuments({
      tournamentId,
    });

    const maxParticipants = tournament.maxParticipants || 20;

    if (participantCount >= maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament is full",
      });
    }

    /*
     * ---------------------------------------------------------
     * DUPLICATE REGISTRATION
     * ---------------------------------------------------------
     */

    const existingParticipant = await Participant.findOne({
      tournamentId,
      user: userId,
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "You already joined this tournament",
      });
    }

    /*
     * ---------------------------------------------------------
     * AUTOMATIC GROUP ASSIGNMENT
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * CREATE PARTICIPANT
     * ---------------------------------------------------------
     */

    const participant = await Participant.create({
      tournamentId,
      user: userId,
      group: assignedGroup,
      seed: assignedSeed,
      status: 'ACTIVE',
      currentStage: 'REGISTRATION',
    });

    /*
     * ---------------------------------------------------------
     * UPDATE TOURNAMENT GROUP COUNT
     * ---------------------------------------------------------
     */

    const currentGroupCount = await Participant.distinct('group', {
      tournamentId,
      group: { $ne: null, $ne: '' },
    });

    const numberOfGroups = currentGroupCount.length;

    if (tournament.numberOfGroups !== numberOfGroups) {
      tournament.numberOfGroups = Math.max(
        tournament.numberOfGroups || 1,
        numberOfGroups
      );
      await tournament.save();
    }

    /*
     * ---------------------------------------------------------
     * AUDIT LOG
     * ---------------------------------------------------------
     */

    await AuditLog.create({
      action: 'PARTICIPANT_REGISTERED',
      description:
        `Participant ${userId} registered for tournament ` +
        `${tournament.name} and was assigned to Group ${assignedGroup}`,
      admin: null,
      tournament: tournamentId,
    });

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return res.status(201).json({
      success: true,
      message: 'Successfully joined tournament',
      participant,
      group: {
        number: assignedGroup,
        name: `Group ${assignedGroup}`,
      },
    });
  } catch (error) {
    console.error("joinTournament error:", error);

    /*
     * MongoDB duplicate-key protection.
     *
     * Your Participant schema already has:
     *
     * { tournamentId: 1, user: 1 } unique
     *
     * So concurrent duplicate registrations are still protected.
     */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already joined this tournament",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getParticipants = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({ tournamentId })
      .populate("user", "name username codeforcesUsername")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error("getParticipants error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// FIXED: getGroups - Dynamically builds groups from participant data
// ============================================================
const getGroups = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({ tournamentId })
      .populate("user", "name username codeforcesUsername")
      .sort({ seed: 1 });

    // ✅ FIX: Dynamically build groups based on actual data
    const groups = {};
    
    participants.forEach((participant) => {
      if (participant.group) {
        if (!groups[participant.group]) {
          groups[participant.group] = [];
        }
        groups[participant.group].push(participant);
      }
    });

    // Sort groups alphabetically for consistent display
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return res.json({
      success: true,
      groups: sortedGroups,
    });
  } catch (error) {
    console.error("getGroups error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin only
const updateParticipant = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const { participantId } = req.params;
    const { group, seed } = req.body;

    const participant = await Participant.findOne({
      _id: participantId,
      tournamentId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (group !== undefined && group !== null && group !== '') participant.group = String(group).toUpperCase();
    if (seed !== undefined && seed !== null) participant.seed = Number(seed);

    await participant.save();

    await AuditLog.create({
      action: "PARTICIPANT_UPDATED",
      description: `Updated participant ${participant.user} (Group: ${
        group || "N/A"
      }, Seed: ${seed || "N/A"})`,
      admin: req.user?._id,
      tournament: tournamentId,
    });

    return res.json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("updateParticipant error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  joinTournament,
  getParticipants,
  getGroups,
  updateParticipant,
};