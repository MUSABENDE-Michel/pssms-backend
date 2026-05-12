const ParkingSlot = require('../models/ParkingSlot');
const ParkingRecord = require('../models/ParkingRecord');
const Payment = require('../models/Payment');
const Car = require('../models/Car');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [
      totalSlots,
      availableSlots,
      occupiedSlots,
      todayRevenue,
      todayCars,
      activeRecords,
      totalCars,
      totalRevenue,
      completedToday
    ] = await Promise.all([
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ slotStatus: 'Available' }),
      ParkingSlot.countDocuments({ slotStatus: 'Occupied' }),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      ParkingRecord.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      ParkingRecord.countDocuments({ parkingStatus: 'Active' }),
      Car.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      ParkingRecord.countDocuments({ 
        parkingStatus: 'Completed',
        exitTime: { $gte: today, $lt: tomorrow }
      })
    ]);
    
    // Recent activities
    const recentActivities = await Payment.find({
      paymentDate: { $gte: today, $lt: tomorrow }
    })
      .populate({
        path: 'parkingRecordId',
        populate: { path: 'carId', select: 'plateNumber' }
      })
      .populate('receivedBy', 'username')
      .sort('-paymentDate')
      .limit(5);
    
    // Chart data - last 7 days revenue
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const revenue = await Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: date, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountPaid' }
          }
        }
      ]);
      
      last7Days.push({
        date: date.toLocaleDateString(),
        revenue: revenue[0]?.total || 0
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        todayRevenue: todayRevenue[0]?.total || 0,
        todayCars,
        activeRecords,
        totalCars,
        totalRevenue: totalRevenue[0]?.total || 0,
        completedToday,
        recentActivities: recentActivities.map(activity => ({
          id: activity._id,
          plateNumber: activity.parkingRecordId?.carId?.plateNumber,
          amount: activity.amountPaid,
          cashier: activity.receivedBy?.username,
          time: activity.paymentDate
        })),
        chartData: last7Days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};