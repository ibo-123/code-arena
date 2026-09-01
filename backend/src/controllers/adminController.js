const AuditLog = require("../models/AuditLog");
const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Match = require("../models/Match");
const User = require("../models/User");

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

// ✅ GET /api/admin/settings
const getAdminSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    return res.json({
      success: true,
      settings: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        tournamentDefaults: {
          maxParticipants: 20,
          numberOfGroups: 4,
          participantsPerGroup: 5,
          qualifiersPerGroup: 2,
          playoffFormat: 'SINGLE_ELIMINATION',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ PUT /api/admin/settings
const updateAdminSettings = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    if (name !== undefined && name !== null && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (email !== undefined && email !== null && String(email).trim()) {
      user.email = String(email).trim().toLowerCase();
    }

    if (password !== undefined && password !== null && String(password).trim()) {
      user.password = String(password).trim();
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAuditLogs, getAdminStats, getAdminSettings, updateAdminSettings };