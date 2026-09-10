const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },

    // ============================================================
    // V1 FIELDS (manual invitation management — no Codeforces API)
    // ============================================================
    name: {
      type: String,
      trim: true,
      required: false, // required by V1 controller, optional at DB level for legacy data
    },
    invitationUrl: {
      type: String,
      trim: true,
      required: false, // the Codeforces invitation/contest link (admin-entered)
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // ============================================================
    // LEGACY / SHARED FIELDS (kept for backward compatibility)
    // ============================================================
    codeforcesContestId: {
      type: Number,
      required: false, // was required: true
    },
    codeforcesContestName: {
      type: String,
      required: false, // was required: true
    },
    codeforcesUrl: {
      type: String,
      required: false, // was required: true
    },
    type: {
      type: String,
      required: false, // was required: true
    },
    phase: {
      type: String,
      required: false, // was required: true
    },

    // ============================================================
    // SCHEDULE
    // ============================================================
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: false, // V1 can use durationSeconds instead
    },
    durationSeconds: {
      type: Number,
      required: false, // was required: true
    },

    // ============================================================
    // ASSIGNMENT
    // ============================================================
    stage: {
      type: String,
      enum: ['QUALIFICATION', 'GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'],
      required: true,
    },
    group: {
      type: String,
      trim: true,
    },
    matchNumber: {
      type: Number,
    },

    // ============================================================
    // STATUS
    // ============================================================
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'PUBLISHED', 'LIVE', 'FINISHED', 'CANCELLED'],
      default: 'DRAFT',
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },

    // ============================================================
    // SYNC METADATA (legacy — not used by V1)
    // ============================================================
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

ContestSchema.index({ tournamentId: 1, codeforcesContestId: 1 }, { unique: true, sparse: true });
ContestSchema.index({ tournamentId: 1, stage: 1 });
ContestSchema.index({ tournamentId: 1, published: 1 });
ContestSchema.index({ tournamentId: 1, group: 1, status: 1 });

module.exports = mongoose.model('Contest', ContestSchema);