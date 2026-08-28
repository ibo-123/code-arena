const Participant = require("../models/Participant");
const Tournament = require("../models/Tournament");
const AuditLog = require("../models/AuditLog");

const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.userId || req.user._id; // handle different auth middleware styles

    if (req.user.role !== "PARTICIPANT") {
      return res.status(403).json({ success: false, message: "Only participants can join a tournament" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({ success: false, message: "Tournament registration is closed" });
    }

    const participantCount = await Participant.countDocuments({ tournament: tournamentId });
    if (participantCount >= tournament.maxParticipants) {
      return res.status(400).json({ success: false, message: "Tournament is full" });
    }

    const existingParticipant = await Participant.findOne({ tournament: tournamentId, user: userId });
    if (existingParticipant) {
      return res.status(409).json({ success: false, message: "You already joined this tournament" });
    }

    const participant = await Participant.create({ tournament: tournamentId, user: userId });
    return res.status(201).json({ success: true, message: "Successfully joined tournament", participant });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getParticipants = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }
    const participants = await Participant.find({ tournament: req.params.id })
      .populate("user", "name username codeforcesUsername")
      .sort({ joinedAt: 1 });

    return res.status(200).json({ success: true, count: participants.length, participants });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getGroups = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    const participants = await Participant.find({ tournament: tournament._id })
      .populate("user", "name username codeforcesUsername")
      .sort({ seed: 1 });
    const groups = { A: [], B: [], C: [], D: [] };
    participants.forEach((participant) => {
      if (participant.group) groups[participant.group].push(participant);
    });
    return res.json({ success: true, groups });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// NEW: Update participant group/seed (Admin only)
const updateParticipant = async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { group, seed } = req.body;

    const participant = await Participant.findOne({ _id: participantId, tournament: tournamentId });
    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    if (group) participant.group = group;
    if (seed) participant.seed = seed;

    await participant.save();

    // Log the action
    await AuditLog.create({
      action: "PARTICIPANT_UPDATED",
      description: `Updated participant ${participant.user} (Group: ${group || 'N/A'}, Seed: ${seed || 'N/A'})`,
      admin: req.user?._id,
      tournament: tournamentId,
    });

    return res.json({ success: true, participant });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  joinTournament,
  getParticipants,
  getGroups,
  updateParticipant,
};