const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for a save']
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Video reference is required for a save']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate saves per user per video
saveSchema.index({ user: 1, video: 1 }, { unique: true });
// Index for fast query of user's saved videos sorted by newest
saveSchema.index({ user: 1, createdAt: -1 });
// Phase 8: Index for fast video save count queries & analytics aggregations
saveSchema.index({ video: 1, createdAt: -1 });

const Save = mongoose.model('Save', saveSchema);

module.exports = Save;
