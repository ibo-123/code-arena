const Participant = require("../models/Participant");
const Tournament = require("../models/Tournament");
const AuditLog = require("../models/AuditLog");

// ... existing methods ...

const updateParticipant = async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { group, seed } = req.body;

    const participant = await Participant.findOne({ _id: participantId, tournamentId });
    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    // Validate group and seed
    if (group) participant.group = group;
    if (seed) participant.seed = seed;

    await participant.save();

    // Log action
    const admin = req.user?._id;
    await AuditLog.create({
      action: "PARTICIPANT_UPDATED",
      description: `Updated participant ${participant.user} (Group: ${group || 'N/A'}, Seed: ${seed || 'N/A'})`,
      admin,
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