const User = require('../models/User');
const Follow = require('../models/Follow');

/**
 * @desc    Get current authenticated user's full profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id })
    ]);

    const userObj = user.toSafeObject();
    userObj.followerCount = followerCount;
    userObj.followingCount = followingCount;

    return res.status(200).json({
      success: true,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current authenticated user's own profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const {
      displayName,
      bio,
      profileImage,
      skills,
      categories,
      location,
      socialLinks
    } = req.body;

    // 1. Update Display Name if provided
    if (displayName !== undefined) {
      const trimmed = displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Display name must be between 2 and 50 characters.'
        });
      }
      user.displayName = trimmed;
    }

    // 2. Update Bio if provided
    if (bio !== undefined) {
      const trimmedBio = bio.trim();
      if (trimmedBio.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 300 characters.'
        });
      }
      user.bio = trimmedBio;
    }

    // 3. Update Location if provided
    if (location !== undefined) {
      const trimmedLoc = location.trim();
      if (trimmedLoc.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Location cannot exceed 100 characters.'
        });
      }
      user.location = trimmedLoc;
    }

    // 4. Update Profile Image URL if provided
    if (profileImage !== undefined) {
      user.profileImage = profileImage.trim();
    }

    // 5. Update Skills if provided
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          message: 'Skills must be an array of skill names.'
        });
      }
      user.skills = skills
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0 && s.length <= 30)
        .slice(0, 20);
    }

    // 6. Update Categories if provided
    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: 'Categories must be an array.'
        });
      }
      user.categories = categories.filter((cat) =>
        User.ALLOWED_CATEGORIES.includes(cat)
      );
    }

    // 7. Update Social Links if provided
    if (socialLinks !== undefined && typeof socialLinks === 'object') {
      user.socialLinks = {
        website: socialLinks.website ? String(socialLinks.website).trim() : user.socialLinks.website,
        instagram: socialLinks.instagram ? String(socialLinks.instagram).trim() : user.socialLinks.instagram,
        youtube: socialLinks.youtube ? String(socialLinks.youtube).trim() : user.socialLinks.youtube,
        github: socialLinks.github ? String(socialLinks.github).trim() : user.socialLinks.github,
        twitter: socialLinks.twitter ? String(socialLinks.twitter).trim() : user.socialLinks.twitter
      };
    }

    // Note: Username, email, and role are strictly immutable in this endpoint.
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public creator profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username parameter is required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Creator '@${cleanUsername}' not found.`
      });
    }

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id })
    ]);

    // Return safe public profile data
    const publicProfile = {
      _id: user._id,
      displayName: user.displayName,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      categories: user.categories,
      location: user.location,
      socialLinks: user.socialLinks,
      followerCount,
      followingCount,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  getPublicProfile
};
