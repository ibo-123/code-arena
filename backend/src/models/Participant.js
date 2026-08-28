const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    group: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
    },
    seed: {
      type: Number,
    },
    rank: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
    solved: {
      type: Number,
      default: 0,
    },
    penalty: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ELIMINATED', 'ADVANCED', 'CHAMPION'],
      default: 'ACTIVE',
    },
    currentRound: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ParticipantSchema.index({ tournamentId: 1, user: 1 }, { unique: true });
ParticipantSchema.index({ tournamentId: 1, group: 1 });

module.exports = mongoose.model('Participant', ParticipantSchema);
