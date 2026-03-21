// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // never return password by default
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  branch: {
    type: String,
    enum: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    default: 'CSE'
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '3rd Year'
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: String,
    default: ''
  },
  incomeCategory: {
    type: String,
    enum: ['General', 'Below 8 LPA', 'Below 5 LPA', 'Below 2.5 LPA'],
    default: 'General'
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
