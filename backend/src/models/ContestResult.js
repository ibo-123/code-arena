const mongoose = require("mongoose");

const contestResultSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },

    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },

    codeforcesHandle: {
      type: String,
      required: true,
    },

    rank: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    penalty: {
      type: Number,
      default: 0,
    },

    solved: {
      type: Number,
      default: 0,
    },

    problemResults: [
      {
        problemIndex: String,
        status: String,
        points: Number,
        attempts: Number,
      },
    ],

    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

contestResultSchema.index(
  { contest: 1, participant: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ContestResult",
  contestResultSchema
);