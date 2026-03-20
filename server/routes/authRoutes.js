const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const authRoutes = express.Router();

authRoutes.post('/register',registerUser);
authRoutes.post('/login',loginUser);
authRoutes.get('/profile', protect, getProfile);

module.exports = authRoutes;