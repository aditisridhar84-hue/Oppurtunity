// routes/users.js
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/profile',   protect, getProfile);
router.put('/profile',   protect, updateProfile);
router.get('/',          protect, adminOnly, getAllUsers);

module.exports = router;
