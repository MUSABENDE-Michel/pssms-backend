const express = require('express');
const { 
  login, 
  register, 
  getMe, 
  logout,
  updateProfile,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/update-profile', updateProfile);
router.put('/update-password', updatePassword);

module.exports = router;