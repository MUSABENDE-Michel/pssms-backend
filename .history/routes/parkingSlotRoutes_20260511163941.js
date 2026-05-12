const express = require('express');
const { getParkingSlots, createParkingSlot, updateParkingSlot, deleteParkingSlot } = require('../controllers/parkingSlotController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getParkingSlots);
router.post('/', authorize('admin'), createParkingSlot);
router.put('/:id', authorize('admin'), updateParkingSlot);
router.delete('/:id', authorize('admin'), deleteParkingSlot);

module.exports = router;