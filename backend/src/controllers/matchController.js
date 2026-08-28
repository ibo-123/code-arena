const Match = require("../models/Match");
const Participant = require("../models/Participant");
const AuditLog = require("../models/AuditLog");

const updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;

    const match = await Match.findById(matchId).populate('participants');
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    if (!match.participants.some(p => p._id.toString() === winnerId)) {
      return res.status(400).json({ success: false, message: "Winner must be one of the participants" });
    }

    match.winner = winnerId;
    match.status = "COMPLETED";
    await match.save();

    // Update participants status
    await Promise.all(match.participants.map(async (p) => {
      const isWinner = p._id.toString() === winnerId;
      await Participant.findByIdAndUpdate(p._id, {
        status: isWinner ? "ADVANCED" : "ELIMINATED",
        currentRound: isWinner ? match.round : "ELIMINATED"
      });
    }));

    // Audit log
    await AuditLog.create({
      action: "MATCH_RESULT_SET",
      description: `Set winner for Match ${match.matchNumber} (${match.round})`,
      admin: req.user?._id,
      tournament: match.tournament,
    });

    return res.json({ success: true, match });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateMatchResult };