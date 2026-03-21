// routes/opportunities.js
const express = require('express');
const router = express.Router();
const {
  getOpportunities, getOpportunityById, getRecommended,
  getUrgent, createOpportunity, updateOpportunity, deleteOpportunity
} = require('../controllers/opportunityController');
const { protect, adminOnly } = require('../middleware/auth');

// Optional auth middleware - adds user if token present, continues if not
const optionalAuth = async (req, res, next) => {
  const { protect: p } = require('../middleware/auth');
  if (req.headers.authorization) {
    return p(req, res, next);
  }
  next();
};

router.get('/',             optionalAuth, getOpportunities);
router.get('/recommended',  protect,      getRecommended);
router.get('/urgent',       optionalAuth, getUrgent);
router.get('/:id',          optionalAuth, getOpportunityById);
router.post('/',            protect, adminOnly, createOpportunity);
router.put('/:id',          protect, adminOnly, updateOpportunity);
router.delete('/:id',       protect, adminOnly, deleteOpportunity);

module.exports = router;
