// models/Opportunity.js
const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['internship', 'scholarship', 'hackathon', 'research', 'competition'],
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  skillsRequired: {
    type: [String],
    default: []
    // e.g. ['Python', 'ML', 'React']
  },
  eligibleBranches: {
    type: [String],
    default: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other']
  },
  eligibleYears: {
    type: [String],
    default: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  minCGPA: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  deadlineDisplay: {
    type: String  // Human-readable e.g. "Mar 31, 2026"
  },
  stipend: {
    type: String,
    default: 'Unpaid'
  },
  description: {
    type: String,
    required: true
  },
  eligibility: {
    type: String,
    default: ''
  },
  applyUrl: {
    type: String,
    default: '#'
  },
  source: {
    type: String,
    default: ''
  },
  emoji: {
    type: String,
    default: '🎯'
  },
  bgColor: {
    type: String,
    default: '#1e3a8a'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: auto-set urgent if deadline < 7 days away
OpportunitySchema.virtual('urgent').get(function() {
  const daysLeft = (new Date(this.deadline) - new Date()) / (1000 * 60 * 60 * 24);
  return daysLeft <= 7 && daysLeft > 0;
});

// Virtual: days remaining
OpportunitySchema.virtual('daysLeft').get(function() {
  const d = Math.ceil((new Date(this.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return d;
});

// Index for fast search
OpportunitySchema.index({ title: 'text', company: 'text', description: 'text' });
OpportunitySchema.index({ deadline: 1 });
OpportunitySchema.index({ type: 1 });
OpportunitySchema.index({ isActive: 1 });

module.exports = mongoose.model('Opportunity', OpportunitySchema);
