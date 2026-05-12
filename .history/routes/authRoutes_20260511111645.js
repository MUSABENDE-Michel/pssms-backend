const express = require('express');
const { 
  login, 
  register, 
  getMe, 
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);
router.patch('/update-password', updatePassword);
router.patch('/update-profile', updateProfile);

module.exports = router;