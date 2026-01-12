const express = require('express');
const router = express.Router();
const {
  createPrediction,
  getAllPredictions,
  getBanker,
  getSurprise,
  getVIP,
  getPredictions,
  getPrediction,
  getMyPredictions,
  updatePrediction,
  deletePrediction,
  generatePredictionsEndpoint,
} = require('../controllers/predictionController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { verifyAdminAuth } = require('../middlewares/adminAuth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Public endpoints - specific routes first
router.get('/all', apiLimiter, getAllPredictions);
router.get('/banker', apiLimiter, getBanker);
router.get('/surprise', apiLimiter, getSurprise);
router.get('/vip', apiLimiter, getVIP); // VIP check is done in controller
router.get('/my', apiLimiter, authenticate, getMyPredictions);
router.get('/', apiLimiter, getPredictions);

// Admin-only endpoints
router.post('/generate', apiLimiter, verifyAdminAuth, generatePredictionsEndpoint);
router.post('/create', apiLimiter, authenticate, requireAdmin, createPrediction);
router.put('/:id', apiLimiter, authenticate, requireAdmin, updatePrediction);
router.delete('/:id', apiLimiter, authenticate, requireAdmin, deletePrediction);

// Get single prediction (must be last to avoid conflicts)
router.get('/:id', apiLimiter, getPrediction);

module.exports = router;

