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

// Routes
router.get('/', getParkingSlots);
router.get('/statistics', getSlotStatistics);
router.get('/available', getAvailableSlots);
router.post('/', authorize('admin'), createParkingSlot);
router.post('/bulk', authorize('admin'), createBulkParkingSlots);
router.put('/:id', authorize('admin'), updateParkingSlot);
router.delete('/:id', authorize('admin'), deleteParkingSlot);

module.exports = router;