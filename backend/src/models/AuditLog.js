const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

auditLogSchema.index({ tournament: 1, createdAt: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
