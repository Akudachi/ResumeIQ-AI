const mongoose = require("mongoose");

// Maintain a global reference to cache the database connection across serverless executions
let cachedConnection = null;

const connectDB = async () => {
  // If a connection already exists, reuse it immediately
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false, // Prevents queries from hanging indefinitely if connection drops
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Keep this blank! No process.exit(1) allowed on serverless platforms.
  }
};

module.exports = connectDB;
