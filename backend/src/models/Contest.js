const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    round: {
      type: String,
      enum: [
        "GROUP_STAGE",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
      ],
      required: true,
    },

    group: {
      type: String,
      enum: ["A", "B", "C", "D", null],
      default: null,
    },

    name: {
      type: String,
      required: true,
    },

    codeforcesContestId: {
      type: Number,
      required: true,
    },

    codeforcesUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PUBLISHED",
        "LIVE",
        "FINISHED",
      ],
      default: "DRAFT",
    },

    startTime: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
    },

    finishedAt: {
      type: Date,
      default: null,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Contest",
  contestSchema
);