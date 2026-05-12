const express = require('express');
const {
  createParkingRecord,
  exitParking,
  getActiveParkingRecords,
  getAllParkingRecords,
  getParkingRecordById,
  deleteParkingRecord
} = require('../controllers/parkingRecordController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createParkingRecord);
router.post('/:id/exit', exitParking);
router.get('/active', getActiveParkingRecords);
router.get('/', getAllParkingRecords);
router.get('/:id', getParkingRecordById);
router.delete('/:id', authorize('admin'), deleteParkingRecord);

module.exports = router;