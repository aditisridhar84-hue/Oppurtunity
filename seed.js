// routes/applications.js
const express = require('express');
const router = express.Router();
const { applyToOpportunity, getMyApplications, updateStatus, getAllApplications } = require('../controllers/applicationController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/apply',    protect, applyToOpportunity);
router.get('/',          protect, getMyApplications);
router.get('/all',       protect, adminOnly, getAllApplications);
router.put('/:id/status',protect, adminOnly, updateStatus);

module.exports = router;
