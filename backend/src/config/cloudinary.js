const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Check if Cloudinary credentials are fully configured
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
  const apiKey = process.env.CLOUDINARY_API_KEY || cloudinary.config().api_key;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || cloudinary.config().api_secret;

  return Boolean(
    cloudName && 
    apiKey && 
    apiSecret && 
    cloudName !== 'your_cloudinary_cloud_name' &&
    apiKey !== 'your_cloudinary_api_key' &&
    apiSecret !== 'your_cloudinary_api_secret'
  );
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured
};
