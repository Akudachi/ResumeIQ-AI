require("dotenv").config();
console.log("Current Directory:", process.cwd());
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize DB connection immediately
connectDB();

// Start server for Render and local development
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`Open the site here: http://localhost:${PORT}`);
  });
}

// Keep-alive mechanism to prevent Render from sleeping (free tier spins down after 15 min inactivity)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const keepAlive = () => {
    const http = require('http');
    const options = {
      host: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`Keep-alive ping: ${res.statusCode}`);
    });

    req.on('error', (err) => {
      console.error('Keep-alive error:', err.message);
    });

    req.end();
  };

  // Ping every 14 minutes (Render spins down after 15 min of inactivity)
  setInterval(keepAlive, 14 * 60 * 1000);
  console.log('Keep-alive mechanism enabled (pings every 14 minutes)');
}

// CRUCIAL: Export the app for Vercel Serverless Handler architecture
module.exports = app;
