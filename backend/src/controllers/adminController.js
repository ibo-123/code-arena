const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const filter = req.query.tournamentId ? { tournament: req.query.tournamentId } : {};
    const logs = await AuditLog.find(filter).populate("admin", "name username").sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { getAuditLogs };
