// routes/analytics.js
const express = require('express');
const router = express.Router();
const { getAnalytics, getMyAnalytics } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',    protect, adminOnly, getAnalytics);
router.get('/me',  protect, getMyAnalytics);

module.exports = router;
