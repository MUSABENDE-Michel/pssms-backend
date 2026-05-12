const express = require('express');
const Payment = require('../models/Payment');
const ParkingRecord = require('../models/ParkingRecord');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Daily payment report
router.get('/daily-payments', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const payments = await Payment.find({
      paymentDate: { $gte: targetDate, $lt: nextDay }
    })
      .populate({
        path: 'parkingRecordId',
        populate: {
          path: 'carId',
          select: 'plateNumber driverName'
        }
      })
      .populate('receivedBy', 'username');
    
    const report = payments.map(payment => ({
      plateNumber: payment.parkingRecordId?.carId?.plateNumber || 'N/A',
      driverName: payment.parkingRecordId?.carId?.driverName || 'N/A',
      entryTime: payment.parkingRecordId?.entryTime,
      exitTime: payment.parkingRecordId?.exitTime,
      duration: payment.parkingRecordId?.duration || 0,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      cashier: payment.receivedBy?.username
    }));
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Revenue summary (admin only)
router.get('/revenue-summary', authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const revenue = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
          total: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Active parking report
router.get('/active-parking', async (req, res) => {
  try {
    const activeRecords = await ParkingRecord.find({ parkingStatus: 'Active' })
      .populate('carId', 'plateNumber driverName phoneNumber')
      .populate('slotId', 'slotNumber')
      .populate('createdBy', 'username');
    
    const report = activeRecords.map(record => ({
      id: record._id,
      plateNumber: record.carId?.plateNumber,
      driverName: record.carId?.driverName,
      phoneNumber: record.carId?.phoneNumber,
      slotNumber: record.slotId?.slotNumber,
      entryTime: record.entryTime,
      duration: ((new Date() - new Date(record.entryTime)) / (1000 * 60 * 60)).toFixed(1),
      cashier: record.createdBy?.username
    }));
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;