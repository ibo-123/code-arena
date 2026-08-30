
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

    const tournamentStart = tournament.startDate
      ? new Date(tournament.startDate)
      : null;

    /*
     * ---------------------------------------------------------
     * REGISTRATION TIME VALIDATION
     * ---------------------------------------------------------
     */

    // Registration has not started yet
    if (registrationStart && now < registrationStart) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has not started yet",
      });
    }

    // Registration has ended
    if (registrationEnd && now >= registrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has ended",
      });
    }

    // Tournament has already started
    if (tournamentStart && now >= tournamentStart) {
      return res.status(400).json({
        success: false,
        message: "Tournament has already started",
      });
    }

    /*
     * ---------------------------------------------------------
     * TOURNAMENT STATUS VALIDATION
     * ---------------------------------------------------------
     *
     * Do not require status === "REGISTRATION" here.
     *
     * The registrationStart/registrationEnd dates determine
     * whether registration is currently open.
     *
     * The status can be updated independently by the tournament
     * lifecycle logic.
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
     * CREATE PARTICIPANT
     * ---------------------------------------------------------
     */

    const participant = await Participant.create({
      tournamentId,
      user: userId,
    });

    /*
     * ---------------------------------------------------------
     * AUDIT LOG
     * ---------------------------------------------------------
     */

    await AuditLog.create({
      action: "PARTICIPANT_REGISTERED",
      description: `Participant ${userId} registered for tournament ${tournament.name}`,
      admin: null,
      tournament: tournamentId,
    });

    return res.status(201).json({
      success: true,
      message: "Successfully joined tournament",
      participant,
    });
  } catch (error) {
    console.error("joinTournament error:", error);

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

    const groups = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

    participants.forEach((participant) => {
      if (participant.group && groups[participant.group]) {
        groups[participant.group].push(participant);
      }
    });

    return res.json({
      success: true,
      groups,
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

    if (group) participant.group = group;
    if (seed) participant.seed = seed;

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
