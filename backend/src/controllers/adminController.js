const AuditLog = require("../models/AuditLog");
const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Match = require("../models/Match");

// ✅ GET /api/admin/audit-logs?tournamentId=...
const getAuditLogs = async (req, res) => {
  try {
    const filter = req.query.tournamentId ? { tournament: req.query.tournamentId } : {};
    const logs = await AuditLog.find(filter)
      .populate("admin", "name username")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [totalTournaments, activeTournaments, totalParticipants, qualifiedParticipants, activeContests, completedContests, upcomingMatches, recentActivity] = await Promise.all([
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: { $ne: "COMPLETED", $ne: "CANCELLED" } }),
      Participant.countDocuments(),
      Participant.countDocuments({ status: { $in: ["ACTIVE", "ADVANCED"] } }),
      Contest.countDocuments({ status: "LIVE" }),
      Contest.countDocuments({ status: "FINISHED" }),
      Match.countDocuments({ status: "PENDING" }),
      AuditLog.find().populate("admin", "name username").sort({ createdAt: -1 }).limit(5)
    ]);

    return res.json({
      success: true,
      stats: {
        totalTournaments,
        activeTournaments,
        totalParticipants,
        qualifiedParticipants,
        activeContests,
        completedContests,
        upcomingMatches,
        recentActivity
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAuditLogs, getAdminStats };