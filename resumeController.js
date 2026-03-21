// models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'pending', 'accepted', 'rejected'],
    default: 'applied'
  },
  matchScore: {
    type: Number,
    default: 0  // AI match score at time of application
  },
  notes: {
    type: String,
    default: ''
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// One user can only apply once per opportunity
ApplicationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
