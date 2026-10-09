const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower user reference is required']
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following target user reference is required'],
      validate: {
        validator: function (value) {
          if (this.follower && value) {
            return this.follower.toString() !== value.toString();
          }
          return true;
        },
        message: 'Users cannot follow themselves'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// Index for fast query of followers and following lists
followSchema.index({ following: 1, createdAt: -1 });
followSchema.index({ follower: 1, createdAt: -1 });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
