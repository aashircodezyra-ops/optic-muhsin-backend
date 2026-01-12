const express = require('express');
const router = express.Router();
const { getAds, getAdBySlot, createAd, updateAd, deleteAd, trackClick } = require('../controllers/adController');
const {
  configureAds,
  getAdConfiguration,
  getConfigurationByPosition,
  deleteAdConfiguration,
  toggleActiveStatus,
  trackImpression,
  trackClick: trackAdClick,
} = require('../controllers/adConfigurationController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { adConfigurationValidator } = require('../middlewares/validator');

// Legacy ad routes (for simple image/link ads)
router.get('/', apiLimiter, getAds);
router.get('/slot/:slot', apiLimiter, getAdBySlot);
router.post('/', apiLimiter, authenticate, requireAdmin, createAd);
router.put('/:id', apiLimiter, authenticate, requireAdmin, updateAd);
router.delete('/:id', apiLimiter, authenticate, requireAdmin, deleteAd);
router.post('/:id/click', apiLimiter, trackClick);

// Ad configuration routes (for provider-based ads: Google AdSense, Taboola, Ezoic, Media.net)
// POST /api/ads/configure - Configure ads
router.post('/configure', apiLimiter, authenticate, requireAdmin, adConfigurationValidator, configureAds);

// GET /api/ads/configure - Get active ad configuration
router.get('/configure', apiLimiter, getAdConfiguration);

// GET /api/ads/configure/position/:position - Get configuration by position
router.get('/configure/position/:position', apiLimiter, getConfigurationByPosition);

// DELETE /api/ads/configure/:id - Delete ad configuration
router.delete('/configure/:id', apiLimiter, authenticate, requireAdmin, deleteAdConfiguration);

// PUT /api/ads/configure/:id/toggle - Toggle active status
router.put('/configure/:id/toggle', apiLimiter, authenticate, requireAdmin, toggleActiveStatus);

// POST /api/ads/configure/:id/impression - Track impression
router.post('/configure/:id/impression', apiLimiter, trackImpression);

// POST /api/ads/configure/:id/click - Track click
router.post('/configure/:id/click', apiLimiter, trackAdClick);

module.exports = router;

