const express = require('express');
const ParkingRecord = require('../models/ParkingRecord');
const ParkingSlot = require('../models/ParkingSlot');
const Car = require('../models/Car');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const calculateFee = (durationHours) => {
  const RATE_PER_HOUR = 500;
  if (durationHours < 1) return RATE_PER_HOUR;
  return Math.ceil(durationHours) * RATE_PER_HOUR;
};

// Create parking record (entry)
router.post('/', async (req, res) => {
  try {
    const { plateNumber, driverName, phoneNumber, slotId } = req.body;
    
    let car = await Car.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (!car) {
      car = await Car.create({
        plateNumber: plateNumber.toUpperCase(),
        driverName,
        phoneNumber
      });
    }
    
    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.slotStatus !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Parking slot is not available'
      });
    }
    
    const parkingRecord = await ParkingRecord.create({
      carId: car._id,
      slotId,
      createdBy: req.user.id,
      entryTime: new Date()
    });
    
    slot.slotStatus = 'Occupied';
    await slot.save();
    
    const populatedRecord = await ParkingRecord.findById(parkingRecord._id)
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber')
      .populate('createdBy', 'username');
    
    res.status(201).json({
      success: true,
      data: populatedRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process exit
router.post('/:id/exit', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const parkingRecord = await ParkingRecord.findById(id)
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber');
    
    if (!parkingRecord || parkingRecord.parkingStatus === 'Completed') {
      return res.status(404).json({
        success: false,
        message: 'Parking record not found or already completed'
      });
    }
    
    const exitTime = new Date();
    const durationMs = exitTime - parkingRecord.entryTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    const duration = Math.ceil(durationHours * 100) / 100;
    const amountPaid = calculateFee(durationHours);
    
    parkingRecord.exitTime = exitTime;
    parkingRecord.duration = duration;
    parkingRecord.parkingStatus = 'Completed';
    await parkingRecord.save();
    
    const payment = await Payment.create({
      parkingRecordId: parkingRecord._id,
      receivedBy: req.user.id,
      amountPaid,
      paymentMethod
    });
    
    await ParkingSlot.findByIdAndUpdate(parkingRecord.slotId._id, {
      slotStatus: 'Available'
    });
    
    const populatedPayment = await Payment.findById(payment._id)
      .populate('receivedBy', 'username');
    
    res.status(200).json({
      success: true,
      data: {
        parkingRecord,
        payment: populatedPayment,
        amountPaid,
        duration
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get active parking records
router.get('/active', async (req, res) => {
  try {
    const records = await ParkingRecord.find({ parkingStatus: 'Active' })
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber')
      .populate('createdBy', 'username')
      .sort('-entryTime');
    
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all parking records
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const query = {};
    
    if (search) {
      const cars = await Car.find({
        $or: [
          { plateNumber: { $regex: search, $options: 'i' } },
          { driverName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.carId = { $in: cars.map(c => c._id) };
    }
    
    if (status !== 'all') {
      query.parkingStatus = status;
    }
    
    const records = await ParkingRecord.find(query)
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber')
      .populate('createdBy', 'username')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const recordsWithPayments = await Promise.all(records.map(async (record) => {
      const payment = await Payment.findOne({ parkingRecordId: record._id });
      return {
        ...record.toObject(),
        payment
      };
    }));
    
    const total = await ParkingRecord.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: recordsWithPayments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single parking record
router.get('/:id', async (req, res) => {
  try {
    const record = await ParkingRecord.findById(req.params.id)
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber')
      .populate('createdBy', 'username');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Parking record not found'
      });
    }
    
    const payment = await Payment.findOne({ parkingRecordId: record._id })
      .populate('receivedBy', 'username');
    
    res.status(200).json({
      success: true,
      data: {
        ...record.toObject(),
        payment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete parking record (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const record = await ParkingRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Parking record not found'
      });
    }
    
    if (record.parkingStatus === 'Active') {
      await ParkingSlot.findByIdAndUpdate(record.slotId, {
        slotStatus: 'Available'
      });
    }
    
    await Payment.findOneAndDelete({ parkingRecordId: record._id });
    await record.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Parking record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;