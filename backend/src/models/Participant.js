const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    group: {
      type: String,
      enum: ["A", "B", "C", "D"],
      default: null,
    },

    currentRound: {
      type: String,
      enum: [
        "GROUP_STAGE",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
        "CHAMPION",
        "ELIMINATED",
      ],
      default: "GROUP_STAGE",
    },

    status: {
      type: String,
      enum: [
        "REGISTERED",
        "ACTIVE",
        "ADVANCED",
        "ELIMINATED",
        "CHAMPION",
      ],
      default: "REGISTERED",
    },

    seed: {
      type: Number,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

participantSchema.index(
  { tournament: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Participant",
  participantSchema
);