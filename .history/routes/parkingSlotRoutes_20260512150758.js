const express = require('express');
const { 
  getParkingSlots, 
  createParkingSlot, 
  createBulkParkingSlots,
  updateParkingSlot, 
  deleteParkingSlot,
  getSlotStatistics,
  getAvailableSlots
} = require('../controllers/parkingSlotController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (for authenticated users)
router.get('/', getParkingSlots);
router.get('/statistics', getSlotStatistics);
router.get('/available', getAvailableSlots);

// Admin only routes
router.post('/', authorize('admin'), createParkingSlot);
router.post('/bulk', authorize('admin'), createBulkParkingSlots);
router.put('/:id', authorize('admin'), updateParkingSlot);
router.delete('/:id', authorize('admin'), deleteParkingSlot);

module.exports = router;