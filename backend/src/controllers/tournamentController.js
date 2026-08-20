const Tournament = require("../models/Tournament");
const advancementService = require("../services/advancementService");
const tournamentService = require("../services/tournamentService");
const Participant = require("../models/Participant");
const ContestResult = require("../models/ContestResult");
const auditLogService = require("../services/auditLogService");

const createTournament = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tournament name is required",
      });
    }

    const existingTournament = await Tournament.findOne({
      name,
    });

    if (existingTournament) {
      return res.status(409).json({
        success: false,
        message: "Tournament already exists",
      });
    }

    const tournament = await Tournament.create({
      name,
      description,
      maxParticipants: 20,
      createdBy: req.user.userId,
    });
    await auditLogService.record({ action: "TOURNAMENT_CREATED", description: `Created tournament ${tournament.name}`, admin: req.user.userId, tournament: tournament._id });

    res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    console.error("Create tournament error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("createdBy", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    console.error("Get tournaments error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

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

    res.status(200).json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error("Get tournament error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
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

    // Tournament must still be accepting participants
    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Tournament has already started",
      });
    }

    const Participant = require("../models/Participant");

    const participants = await Participant.find({
      tournament: tournamentId,
    });

    // We require exactly 20 participants
    if (participants.length !== 20) {
      return res.status(400).json({
        success: false,
        message: `Tournament requires exactly 20 participants. Currently there are ${participants.length}.`,
      });
    }

    // Shuffle participants
    const shuffled = [...participants];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    const groups = ["A", "B", "C", "D"];

    // Assign groups and seeds
    for (let i = 0; i < shuffled.length; i++) {
      const participant = shuffled[i];

      const groupIndex = Math.floor(i / 5);
      const seed = i + 1;

      participant.group = groups[groupIndex];
      participant.seed = seed;
      participant.status = "ACTIVE";
      participant.currentRound = "GROUP_STAGE";

      await participant.save();
    }

    // Update tournament
    tournament.status = "GROUP_STAGE";
    tournament.currentRound = "GROUP_STAGE";

    await tournament.save();
    await auditLogService.record({ action: "TOURNAMENT_STARTED", description: "Started tournament and generated groups A-D", admin: req.user.userId, tournament: tournament._id, metadata: { participantCount: participants.length } });

    res.status(200).json({
      success: true,
      message: "Tournament started successfully",
      tournament,
    });
  } catch (error) {
    console.error("Start tournament error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getBracket = async (req, res) => {
  try {
    const bracket = await tournamentService.getBracket(req.params.id);
    res.status(200).json({
      success: true,
      bracket
    });
  } catch (error) {
    console.error("Get bracket error:", error);
    res.status(error.message === "Tournament not found" ? 404 : 500).json({ success: false, message: error.message === "Tournament not found" ? error.message : "Server error" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    const participants = await Participant.find({ tournament: req.params.id })
      .populate("user", "name username codeforcesUsername")
      .sort({ status: -1, currentRound: -1 });

    const results = await Promise.all(participants.map(async (p) => {
      const latestResult = await ContestResult.findOne({ participant: p._id })
        .sort({ syncedAt: -1 })
        .populate("contest", "name round group");

      return { participant: p, group: p.group, currentRound: p.currentRound, status: p.status,
        latestRank: latestResult ? latestResult.rank : null, solved: latestResult ? latestResult.solved : 0,
        score: latestResult ? latestResult.score : 0, penalty: latestResult ? latestResult.penalty : 0, latestResult };
    }));

    const grouped = results.reduce((accumulator, entry) => {
      if (entry.group) (accumulator[entry.group] ||= []).push(entry);
      return accumulator;
    }, {});
    Object.values(grouped).forEach((entries) => entries
      .sort((a, b) => (a.latestRank || Number.MAX_SAFE_INTEGER) - (b.latestRank || Number.MAX_SAFE_INTEGER))
      .forEach((entry, index) => { entry.groupRank = index + 1; entry.winRate = entry.status === "CHAMPION" ? 100 : null; }));

    res.status(200).json({
      success: true,
      leaderboard: results
    });
  } catch (error) {
    console.error("Tournament leaderboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const advanceGroupStage = async (req, res) => {
  try {
    const advancing = await advancementService.advanceGroupStage(req.params.id);
    await auditLogService.record({ action: "GROUP_STAGE_ADVANCED", description: "Advanced group-stage qualifiers to quarter finals", admin: req.user.userId, tournament: req.params.id });
    res.status(200).json({ success: true, message: "Advanced to Quarter Finals", advancing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const advanceQuarterFinal = async (req, res) => {
  try {
    const advancing = await advancementService.advanceQuarterFinal(req.params.id);
    await auditLogService.record({ action: "QUARTER_FINAL_ADVANCED", description: "Advanced quarter-final winners to semi finals", admin: req.user.userId, tournament: req.params.id });
    res.status(200).json({ success: true, message: "Advanced to Semi Finals", advancing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const advanceSemiFinal = async (req, res) => {
  try {
    const advancing = await advancementService.advanceSemiFinal(req.params.id);
    await auditLogService.record({ action: "SEMI_FINAL_ADVANCED", description: "Advanced semi-final winners to the final", admin: req.user.userId, tournament: req.params.id });
    res.status(200).json({ success: true, message: "Advanced to Final", advancing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const completeTournament = async (req, res) => {
  try {
    const winnerId = await advancementService.completeTournament(req.params.id);
    await auditLogService.record({ action: "TOURNAMENT_COMPLETED", description: "Completed tournament and crowned champion", admin: req.user.userId, tournament: req.params.id, metadata: { champion: winnerId } });
    res.status(200).json({ success: true, message: "Tournament completed", winnerId });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTournament,
  getTournaments,
  getTournament,
  startTournament,
  getBracket,
  getLeaderboard,
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament
};
