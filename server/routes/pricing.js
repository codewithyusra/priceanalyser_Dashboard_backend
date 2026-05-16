const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  generateRecommendation,
  getRecommendations,
  updateRecommendationStatus,
  getAuditLogs,
  recheckAll,
  getTrends,
  exportRecommendationsCSV,
} = require('../controllers/pricingController');

router.post('/generate/:productId', auth, generateRecommendation);
router.post('/recheck-all', auth, recheckAll);
router.get('/recommendations', auth, getRecommendations);
router.get('/export', auth, exportRecommendationsCSV);
router.patch('/recommendation/:id', auth, updateRecommendationStatus);
router.get('/audit', auth, getAuditLogs);
router.get('/trends', auth, getTrends);

module.exports = router;
