const { getDBStatus } = require('../config/db');

/**
 * @desc    Get API & Database health status
 * @route   GET /api/health
 * @access  Public
 */
const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  const healthData = {
    status: 'ok',
    service: 'Spotly Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    timestamp: new Date().toISOString(),
    database: dbStatus
  };

  return res.status(200).json(healthData);
};

/**
 * Format uptime seconds into human-readable string
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}

module.exports = {
  getHealth
};
