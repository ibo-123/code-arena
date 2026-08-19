const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "REGISTRATION",
        "GROUP_STAGE",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
        "COMPLETED",
      ],
      default: "REGISTRATION",
    },

    maxParticipants: {
      type: Number,
      default: 20,
    },

    currentRound: {
      type: String,
      enum: [
        "GROUP_STAGE",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
      ],
      default: "GROUP_STAGE",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);