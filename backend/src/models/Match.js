const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }, // Alias for compatibility
  stage: { type: String, enum: ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"], required: true },
  matchNumber: { type: Number, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true }],
  contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" }, // Alias for compatibility
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", default: null },
  status: { type: String, enum: ["PENDING", "LIVE", "COMPLETED"], default: "PENDING" },
}, { timestamps: true });

matchSchema.index({ tournament: 1, stage: 1, matchNumber: 1 }, { unique: true });

// Keep alias fields in sync
matchSchema.pre('save', function () {
  if (this.tournament) this.tournamentId = this.tournament;
  if (this.contest) this.contestId = this.contest;
});

module.exports = mongoose.model("Match", matchSchema);