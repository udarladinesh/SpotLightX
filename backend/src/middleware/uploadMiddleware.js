const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Allowed MIME types
const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/ogg',
  'video/avi',
  'video/x-msvideo'
];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// Disk storage to stream large files (up to 100MB) without memory spikes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `spotly-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (ALLOWED_VIDEO_MIMES.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    return cb(new Error('Invalid video format. Supported formats: MP4, WebM, MOV, MKV.'), false);
  }

  if (file.fieldname === 'thumbnail') {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    return cb(new Error('Invalid thumbnail format. Supported formats: JPEG, PNG, WebP.'), false);
  }

  return cb(new Error(`Unexpected upload field: ${file.fieldname}`), false);
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max limit
  }
});

// Middleware for video and optional thumbnail
const uploadVideoFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Wrapper middleware to catch Multer errors cleanly as JSON
const handleUpload = (req, res, next) => {
  uploadVideoFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum limit of 100MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload validation failed.'
      });
    }
    next();
  });
};

module.exports = {
  handleUpload,
  ALLOWED_VIDEO_MIMES,
  ALLOWED_IMAGE_MIMES
};
