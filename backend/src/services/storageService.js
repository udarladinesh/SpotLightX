const fs = require('fs');
const { Readable } = require('stream');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Upload video (from file path or buffer) to Cloudinary media storage
 * @param {string|Buffer} fileSource - File system path or Buffer
 * @param {string} originalname - Original file name
 * @returns {Promise<Object>} Upload result { videoUrl, publicId, duration, format, thumbnailUrl, bytes }
 */
const uploadVideo = (fileSource, originalname = 'video.mp4') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary media storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.'
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'spotly/videos',
        chunk_size: 6000000, // 6MB chunks for resilient streaming
        eager_async: false
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Video Upload Error:', error);
          return reject(new Error(`Failed to upload video to cloud storage: ${error.message}`));
        }

        // Generate an auto-derived thumbnail URL from Cloudinary video if available
        const autoThumbnailUrl = result.secure_url
          ? result.secure_url.replace(/\.[^/.]+$/, '.jpg')
          : '';

        resolve({
          videoUrl: result.secure_url || result.url,
          publicId: result.public_id,
          duration: result.duration ? Math.round(result.duration) : 0,
          format: result.format,
          thumbnailUrl: autoThumbnailUrl,
          bytes: result.bytes
        });
      }
    );

    if (typeof fileSource === 'string') {
      const readStream = fs.createReadStream(fileSource);
      readStream.on('error', (err) => {
        reject(new Error(`Failed to read video file from disk: ${err.message}`));
      });
      readStream.pipe(uploadStream);
    } else if (Buffer.isBuffer(fileSource)) {
      Readable.from(fileSource).pipe(uploadStream);
    } else if (fileSource && typeof fileSource.pipe === 'function') {
      fileSource.pipe(uploadStream);
    } else {
      reject(new Error('Invalid file source for video upload.'));
    }
  });
};

/**
 * Upload custom image thumbnail (from file path or buffer) to Cloudinary
 * @param {string|Buffer} fileSource - Image file path or Buffer
 * @returns {Promise<Object>} { thumbnailUrl, thumbnailPublicId }
 */
const uploadThumbnail = (fileSource) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary media storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.'
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'spotly/thumbnails',
        transformation: [{ width: 800, height: 450, crop: 'fill' }]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Thumbnail Upload Error:', error);
          return reject(new Error(`Failed to upload thumbnail to cloud storage: ${error.message}`));
        }

        resolve({
          thumbnailUrl: result.secure_url || result.url,
          thumbnailPublicId: result.public_id
        });
      }
    );

    if (typeof fileSource === 'string') {
      const readStream = fs.createReadStream(fileSource);
      readStream.on('error', (err) => {
        reject(new Error(`Failed to read thumbnail file from disk: ${err.message}`));
      });
      readStream.pipe(uploadStream);
    } else if (Buffer.isBuffer(fileSource)) {
      Readable.from(fileSource).pipe(uploadStream);
    } else if (fileSource && typeof fileSource.pipe === 'function') {
      fileSource.pipe(uploadStream);
    } else {
      reject(new Error('Invalid file source for thumbnail upload.'));
    }
  });
};

/**
 * Delete video asset from Cloudinary
 * @param {string} publicId - Cloudinary asset public ID
 * @returns {Promise<Object>}
 */
const deleteVideoAsset = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return { result: 'skipped' };
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    console.error(`Error deleting video asset (${publicId}):`, error.message);
    return { error: error.message };
  }
};

/**
 * Delete image thumbnail asset from Cloudinary
 * @param {string} publicId - Cloudinary image asset public ID
 * @returns {Promise<Object>}
 */
const deleteThumbnailAsset = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return { result: 'skipped' };
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error(`Error deleting thumbnail asset (${publicId}):`, error.message);
    return { error: error.message };
  }
};

module.exports = {
  uploadVideo,
  uploadThumbnail,
  deleteVideoAsset,
  deleteThumbnailAsset,
  isCloudinaryConfigured
};
