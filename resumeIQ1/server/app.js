const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require("./config/database");
const logger = require('./config/logger');

const app = express();

// Security middleware inside app.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://*.jsdelivr.net",
        "https://*.cloudflare.com",
        "https://*.googleapis.com"
      ],
      styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://*.jsdelivr.net",
        "https://*.cloudflare.com",
        "https://*.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://*.jsdelivr.net",
        "https://*.cloudflare.com"
      ],
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://*.jsdelivr.net",
        "https://*.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://*.gstatic.com",
        "https://*.cloudflare.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://*.vercel.app",
        "https://*.jsdelivr.net"
      ],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Serve static files (CSS, JS, Images) using an absolute path strategy
app.use(express.static(path.resolve(__dirname, '..', 'client')));

// CRUCIAL SERVERLESS HOOK: Verifies MongoDB connectivity before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed temporarily" });
  }
});

// API routes
app.use('/api', require('./routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve specific static html pages explicitly for direct route refreshes
app.get('/report.html', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'report.html'));
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

// Catch-all route to serve static files for any remaining routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
