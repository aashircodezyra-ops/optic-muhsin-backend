const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize news service cache and cron after DB connection
const mongoose = require('mongoose');
mongoose.connection.once('open', async () => {
  try {
    const { initializeCache } = require('./src/services/newsService');
    await initializeCache();
  } catch (error) {
    console.error('⚠️  News cache initialization error (non-fatal):', error.message);
  }

  // Start news cron after DB is ready
  try {
    const { startNewsCron } = require('./src/cron/newsCron');
    startNewsCron();
  } catch (error) {
    console.error('⚠️  News cron initialization error (non-fatal):', error.message);
  }
});

// Initialize other cron jobs (with error handling - failures should not stop server)
try {
  require('./src/cron/newsCron');
} catch (error) {
  console.error('⚠️  News cron initialization error (non-fatal):', error.message);
  // Continue server startup even if news cron fails
}

// Initialize predictions cron job after DB connection
mongoose.connection.once('open', async () => {
  try {
    const { startPredictionsCron } = require('./src/cron/predictionsCron');
    startPredictionsCron();
  } catch (error) {
    console.error('⚠️  Predictions cron initialization error (non-fatal):', error.message);
  }
});

const app = express();

// Middleware - CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost on any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow configured frontend URLs
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',  // Next.js default port
      'http://localhost:5173',  // Vite default port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all in development (for flexibility)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/vip', require('./src/routes/vip'));
app.use('/api/predictions', require('./src/routes/predictions'));
app.use('/api/live-scores', require('./src/routes/liveScores'));
app.use('/api/bulletin', require('./src/routes/bulletin'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/admin/comments', require('./src/routes/adminComments'));
app.use('/api/news', require('./src/routes/news'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/ads', require('./src/routes/ads'));
app.use('/api/settings', require('./src/routes/settings'));

// Sports API routes
app.use('/api/football', require('./src/routes/football'));
app.use('/api/basketball', require('./src/routes/basketball'));

// ⚠️  TEMPORARY SETUP ROUTES - DELETE AFTER USE!
// These routes are for development/testing only
// Remove this line after creating admin and fixing vipPlan:
app.use('/api/setup', require('./src/routes/setup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OptikGoal API is running' });
});

// API Status (diagnostic endpoint)
app.use('/api/status', require('./src/routes/apiStatus'));

// Database connection test route
app.get('/test/db', (req, res) => {
  const mongoose = require('mongoose');
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    status: isConnected ? 'ok' : 'error',
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    message: isConnected
      ? 'MongoDB connection is active'
      : 'MongoDB connection is not active'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Ensure JSON response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't crash the server, but log it
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

