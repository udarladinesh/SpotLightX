const validator = require('validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new creator / viewer account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { displayName, username, email, password, confirmPassword, categories, skills } = req.body;

    // 1. Check required fields
    if (!displayName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Display Name, Username, Email, and Password.'
      });
    }

    // 2. Validate Display Name
    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be between 2 and 50 characters.'
      });
    }

    // 3. Validate Username
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters.'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain alphanumeric characters and underscores (a-z, 0-9, _).'
      });
    }

    // 4. Validate Email
    const cleanEmail = email.trim().toLowerCase();
    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // 5. Validate Password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 6. Check Password Confirmation
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // 7. Check if Email already exists
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 8. Check if Username already exists
    const usernameExists = await User.findOne({ username: cleanUsername });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another.'
      });
    }

    // 9. Sanitize categories if provided
    let userCategories = [];
    if (Array.isArray(categories)) {
      userCategories = categories.filter((cat) => User.ALLOWED_CATEGORIES.includes(cat));
    }

    // 10. Sanitize skills if provided
    let userSkills = [];
    if (Array.isArray(skills)) {
      userSkills = skills
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0)
        .slice(0, 20);
    }

    // 11. Create User (Strictly enforce role 'user', never admin from public registration)
    const user = await User.create({
      displayName: trimmedName,
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'user',
      categories: userCategories,
      skills: userSkills,
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`
    });

    // 12. Issue Token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;

    // Accept either identifier (email or username) or separate fields
    const loginTarget = identifier || email || username;

    if (!loginTarget || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your email/username and password.'
      });
    }

    const cleanTarget = loginTarget.trim().toLowerCase();

    // Query by either email or username
    const user = await User.findOne({
      $or: [{ email: cleanTarget }, { username: cleanTarget }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    // Validate password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    // Issue Token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (client-side token removal acknowledgment)
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser
};
