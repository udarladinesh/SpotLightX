const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/generateToken');

/**
 * Protect routes: verifies JWT and attaches authenticated user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret);

      // Fetch user and attach to request (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error(`Auth Middleware Error: ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Please log in again.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.'
    });
  }
};

module.exports = {
  protect
};
