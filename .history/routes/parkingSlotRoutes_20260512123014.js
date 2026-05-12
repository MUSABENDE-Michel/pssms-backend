const express = require('express');
const { 
  getParkingSlots, 
  createParkingSlot, 
  createBulkParkingSlots,
  updateParkingSlot, 
  deleteParkingSlot,
  getSlotStatistics
} = require('../controllers/parkingSlotController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getParkingSlots);
router.get('/statistics', getSlotStatistics);
router.post('/', authorize('admin'), createParkingSlot);
router.post('/bulk', authorize('admin'), createBulkParkingSlots);
router.put('/:id', authorize('admin'), updateParkingSlot);
router.delete('/:id', authorize('admin'), deleteParkingSlot);

module.exports = router;