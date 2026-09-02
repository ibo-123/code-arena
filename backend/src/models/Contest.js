const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    codeforcesContestId: {
      type: Number,
      required: true,
    },
    codeforcesContestName: {
      type: String,
      required: true,
    },
    codeforcesUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    phase: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    stage: {
      type: String,
      enum: ['GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'],
      required: true,
    },
    group: {
      type: String,
      trim: true,
    },
    matchNumber: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'PUBLISHED', 'LIVE', 'FINISHED', 'CANCELLED'],
      default: 'UPCOMING',
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    lastSyncedAt: {
      type: Date,
    },
    syncedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ContestSchema.index({ tournamentId: 1, codeforcesContestId: 1 }, { unique: true });
ContestSchema.index({ tournamentId: 1, stage: 1 });
ContestSchema.index({ tournamentId: 1, published: 1 });

module.exports = mongoose.model('Contest', ContestSchema);
