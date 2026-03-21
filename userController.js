// =============================================
// OpportunIQ - Main Server Entry Point
// =============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded resumes statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files from /frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes ────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/opportunities',require('./routes/opportunities'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/resume',       require('./routes/resume'));

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ── Catch-all: serve frontend index ──────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Connect to MongoDB & Start ────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 OpportunIQ server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
