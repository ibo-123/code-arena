const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  round: { type: String, enum: ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"], required: true },
  matchNumber: { type: Number, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true }],
  contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", default: null },
}, { timestamps: true });

matchSchema.index({ tournament: 1, round: 1, matchNumber: 1 }, { unique: true });
module.exports = mongoose.model("Match", matchSchema);
