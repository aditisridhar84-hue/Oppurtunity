// controllers/applicationController.js
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const { computeMatchScore } = require('../utils/aiMatcher');

// @desc    Apply to an opportunity
// @route   POST /api/applications/apply
// @access  Private
const applyToOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.body;

    // Check opportunity exists and is still active
    const opp = await Opportunity.findById(opportunityId);
    if (!opp || !opp.isActive) {
      return res.status(404).json({ success: false, message: 'Opportunity not found or no longer active.' });
    }

    // Check deadline hasn't passed
    if (new Date(opp.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'This opportunity has already closed.' });
    }

    // Compute match score at time of application
    const matchScore = computeMatchScore(req.user, opp);

    // Create application (will fail if duplicate due to unique index)
    const application = await Application.create({
      userId: req.user._id,
      opportunityId,
      matchScore,
      status: 'applied'
    });

    await application.populate('opportunityId', 'title company type emoji deadline stipend');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: application
    });

  } catch (err) {
    // Duplicate key = already applied
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied to this opportunity.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all applications for logged-in user
// @route   GET /api/applications
// @access  Private
const getMyApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const applications = await Application.find(filter)
      .populate('opportunityId', 'title company type emoji deadline stipend applyUrl')
      .sort({ appliedAt: -1 });

    res.json({ success: true, count: applications.length, data: applications });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update application status (admin only)
// @route   PUT /api/applications/:id/status
// @access  Admin
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('opportunityId userId');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all applications (admin)
// @route   GET /api/applications/all
// @access  Admin
const getAllApplications = async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('userId', 'name email branch year')
      .populate('opportunityId', 'title company type')
      .sort({ appliedAt: -1 });

    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { applyToOpportunity, getMyApplications, updateStatus, getAllApplications };
