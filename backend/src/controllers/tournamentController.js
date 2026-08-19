const Tournament = require("../models/Tournament");

const createTournament = async (req, res) => {
  try {
    const { name, description, maxParticipants } = req.body;

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
      maxParticipants: maxParticipants || 20,
      createdBy: req.user.userId,
    });

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
module.exports = {
  createTournament,
  getTournaments,
  getTournament,
  startTournament,
};