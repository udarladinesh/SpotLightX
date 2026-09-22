const mongoose = require('mongoose');
const User = require('./User');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
      trim: true
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required']
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      required: [true, 'Cloud public ID is required for video management']
    },
    thumbnailPublicId: {
      type: String,
      default: ''
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Talent category is required'],
      enum: {
        values: User.ALLOWED_CATEGORIES,
        message: '{VALUE} is not an allowed Spotly talent category'
      },
      index: true
    },
    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [30, 'Skill name cannot exceed 30 characters']
        }
      ],
      validate: [
        (val) => val.length <= 20,
        'Cannot add more than 20 skills to a video'
      ],
      default: []
    },
    duration: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Composite index for fast category & recency querying
videoSchema.index({ category: 1, createdAt: -1 });
videoSchema.index({ creator: 1, createdAt: -1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
