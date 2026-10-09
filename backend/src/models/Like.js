const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for a like']
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Video reference is required for a like']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate likes at database level
likeSchema.index({ user: 1, video: 1 }, { unique: true });
// Index on video to allow fast like count queries
likeSchema.index({ video: 1, createdAt: -1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
