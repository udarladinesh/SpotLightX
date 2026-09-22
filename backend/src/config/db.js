const mongoose = require('mongoose');

let connectionState = {
  status: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  host: null,
  databaseName: null,
  error: null
};

/**
 * Connect to MongoDB Atlas / Local MongoDB instance
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri === 'your_mongodb_connection_string') {
    connectionState.status = 'disconnected';
    connectionState.error = 'MONGODB_URI is not set. Please set MONGODB_URI in backend/.env with your MongoDB Atlas or local connection string.';
    console.warn('\n⚠️ [Database Warning]: MONGODB_URI is not configured in backend/.env.');
    console.warn('👉 To connect MongoDB: Add MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/spotly to backend/.env\n');
    return;
  }

  try {
    connectionState.status = 'connecting';
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(uri);
    
    connectionState.status = 'connected';
    connectionState.host = conn.connection.host;
    connectionState.databaseName = conn.connection.name;
    connectionState.error = null;

    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    connectionState.status = 'error';
    connectionState.error = error.message;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('👉 Please verify your connection string, network access/whitelist, and database user credentials.\n');
  }
};

/**
 * Get current database connection state for health check
 */
const getDBStatus = () => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const currentReadyState = mongoose.connection.readyState;
  const status = readyStates[currentReadyState] || connectionState.status;

  return {
    status,
    host: connectionState.host || (mongoose.connection.host || null),
    databaseName: connectionState.databaseName || (mongoose.connection.name || null),
    error: connectionState.error
  };
};

module.exports = {
  connectDB,
  getDBStatus
};
