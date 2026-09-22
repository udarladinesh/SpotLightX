const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Allowed talent categories on Spotly platform
const ALLOWED_CATEGORIES = [
  'Dance & Movement',
  'Singing & Vocals',
  'Acting & Drama',
  'Choreography',
  'Art & Design',
  'Music & Production',
  'Photography & Film',
  'Public Speaking',
  'Tech & Programming',
  'Creative Performance'
];

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [2, 'Display name must be at least 2 characters'],
      maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain alphanumeric characters and underscores'
      ]
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Exclude from find queries by default
    },
    profileImage: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
      trim: true
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
        'Cannot add more than 20 skills'
      ],
      default: []
    },
    categories: {
      type: [
        {
          type: String,
          enum: {
            values: ALLOWED_CATEGORIES,
            message: '{VALUE} is not a recognized Spotly talent category'
          }
        }
      ],
      default: []
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
      trim: true
    },
    socialLinks: {
      website: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object (strips sensitive fields)
userSchema.methods.toSafeObject = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

// Export constants alongside model
const User = mongoose.model('User', userSchema);
User.ALLOWED_CATEGORIES = ALLOWED_CATEGORIES;

module.exports = User;
