const jwt = require('jsonwebtoken');

/**
 * Get JWT secret with production enforcement
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
    }
    return 'spotly_dev_jwt_secret_fallback_key_2026';
  }
  return secret;
};

/**
 * Generate a signed JWT for an authenticated user
 * @param {string} id - User ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign({ id }, secret, {
    expiresIn
  });
};

module.exports = generateToken;
module.exports.getJwtSecret = getJwtSecret;
