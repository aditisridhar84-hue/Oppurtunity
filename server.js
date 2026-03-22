const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - files are all in root directory
app.use('/api/auth',          require('./auth'));
app.use('/api/opportunities', require('./opportunities'));
app.use('/api/applications',  require('./applications'));
app.use('/api/users',         require('./users'));
app.use('/api/analytics',     require('./analytics'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('OpportunIQ API is running!');
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });
