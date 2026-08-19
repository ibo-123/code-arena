const Participant = require("../models/Participant");
const Tournament = require("../models/Tournament");

const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId;

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    // Check registration status
    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Tournament registration is closed",
      });
    }

    // Check participant limit
    const participantCount = await Participant.countDocuments({
      tournament: tournamentId,
    });

    if (participantCount >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament is full",
      });
    }

    // Check if user already joined
    const existingParticipant = await Participant.findOne({
      tournament: tournamentId,
      user: userId,
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "You already joined this tournament",
      });
    }

    // Create participant
    const participant = await Participant.create({
      tournament: tournamentId,
      user: userId,
    });

    res.status(201).json({
      success: true,
      message: "Successfully joined tournament",
      participant,
    });
  } catch (error) {
    console.error("Join tournament error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getParticipants = async (req, res) => {
  try {
    const participants = await Participant.find({
      tournament: req.params.id,
    })
      .populate(
        "user",
        "name username codeforcesUsername"
      )
      .sort({ joinedAt: 1 });

    res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error("Get participants error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  joinTournament,
  getParticipants,
};