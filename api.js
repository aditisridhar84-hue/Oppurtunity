// controllers/userController.js
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'branch', 'year', 'cgpa', 'skills', 'interests', 'incomeCategory'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Profile updated! AI is recalculating your matches...',
      data: user
    });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, getAllUsers };
