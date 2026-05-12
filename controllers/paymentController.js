const Payment = require('../models/Payment');

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      // Search by plate number through parking records
      const ParkingRecord = require('../models/ParkingRecord');
      const Car = require('../models/Car');
      
      const cars = await Car.find({
        plateNumber: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const parkingRecords = await ParkingRecord.find({
        carId: { $in: cars.map(c => c._id) }
      }).select('_id');
      
      query.parkingRecordId = { $in: parkingRecords.map(pr => pr._id) };
    }
    
    const payments = await Payment.find(query)
      .populate({
        path: 'parkingRecordId',
        populate: {
          path: 'carId',
          select: 'plateNumber driverName'
        }
      })
      .populate('receivedBy', 'username')
      .sort('-paymentDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(query);
    const totalRevenue = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: payments,
      total,
      totalRevenue: totalRevenue[0]?.total || 0,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'parkingRecordId',
        populate: {
          path: 'carId',
          select: 'plateNumber driverName phoneNumber'
        }
      })
      .populate('receivedBy', 'username');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    await payment.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};