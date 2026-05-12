const ParkingSlot = require('../models/ParkingSlot');

// Get all parking slots
exports.getParkingSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort('slotNumber');
    
    res.status(200).json({
      success: true,
      data: slots,
      total: slots.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get slot statistics
exports.getSlotStatistics = async (req, res) => {
  try {
    const totalSlots = await ParkingSlot.countDocuments();
    const availableSlots = await ParkingSlot.countDocuments({ slotStatus: 'Available' });
    const occupiedSlots = await ParkingSlot.countDocuments({ slotStatus: 'Occupied' });
    const reservedSlots = await ParkingSlot.countDocuments({ slotStatus: 'Reserved' });
    const maintenanceSlots = await ParkingSlot.countDocuments({ slotStatus: 'Maintenance' });
    
    const slotsByType = await ParkingSlot.aggregate([
      { $group: { _id: '$slotType', count: { $sum: 1 } } }
    ]);
    
    const slotsByFloor = await ParkingSlot.aggregate([
      { $group: { _id: '$floor', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        maintenanceSlots,
        occupancyRate: totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0,
        slotsByType,
        slotsByFloor
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available slots for entry
exports.getAvailableSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ slotStatus: 'Available' }).sort('slotNumber');
    
    res.status(200).json({
      success: true,
      data: slots,
      count: slots.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create single parking slot
exports.createParkingSlot = async (req, res) => {
  try {
    const { slotType, floor, zone, hourlyRate, dailyRate, monthlyRate, features, size } = req.body;
    
    // Get the last slot number safely
    const lastSlot = await ParkingSlot.findOne().sort('-slotNumber');
    let nextSlotNumber = 1;
    
    if (lastSlot && typeof lastSlot.slotNumber === 'number') {
      nextSlotNumber = lastSlot.slotNumber + 1;
    }
    
    // Create slot with explicit slotNumber
    const slot = await ParkingSlot.create({
      slotNumber: nextSlotNumber,
      slotType: slotType || 'Standard',
      floor: floor || 'Ground Floor',
      zone: zone || 'Zone A',
      size: size || 'Standard (2.5m x 5.5m)',
      hourlyRate: hourlyRate || 500,
      dailyRate: dailyRate || 3000,
      monthlyRate: monthlyRate || 50000,
      features: features || ['Covered', 'Security Camera'],
      slotStatus: 'Available'
    });
    
    res.status(201).json({
      success: true,
      data: slot,
      message: `Slot ${slot.slotCode || slot.slotNumber} created successfully`
    });
  } catch (error) {
    console.error('Error creating slot:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create parking slot'
    });
  }
};

// Create bulk parking slots
exports.createBulkParkingSlots = async (req, res) => {
  try {
    const { 
      count, 
      startFrom, 
      slotType = 'Standard', 
      floor = 'Ground Floor',
      zone = 'Zone A',
      features = ['Covered', 'Security Camera']
    } = req.body;
    
    // Validate count
    const numSlots = parseInt(count);
    if (isNaN(numSlots) || numSlots < 1 || numSlots > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid count between 1 and 100'
      });
    }
    
    // Get the last slot number
    const lastSlot = await ParkingSlot.findOne().sort('-slotNumber');
    let startSlotNumber = 1;
    
    if (lastSlot && typeof lastSlot.slotNumber === 'number') {
      startSlotNumber = lastSlot.slotNumber + 1;
    }
    
    if (startFrom && !isNaN(parseInt(startFrom))) {
      startSlotNumber = parseInt(startFrom);
    }
    
    const slots = [];
    for (let i = 0; i < numSlots; i++) {
      const slotNumber = startSlotNumber + i;
      const slot = await ParkingSlot.create({
        slotNumber,
        slotType,
        floor,
        zone,
        features,
        slotStatus: 'Available'
      });
      slots.push(slot);
    }
    
    res.status(201).json({
      success: true,
      message: `${numSlots} parking slots created successfully`,
      data: slots
    });
  } catch (error) {
    console.error('Error bulk creating slots:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create parking slots'
    });
  }
};

// Update parking slot
exports.updateParkingSlot = async (req, res) => {
  try {
    const { slotType, slotStatus, floor, zone, hourlyRate, dailyRate, monthlyRate, features, size } = req.body;
    
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { 
        slotType, 
        slotStatus, 
        floor, 
        zone, 
        hourlyRate, 
        dailyRate, 
        monthlyRate, 
        features, 
        size, 
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: slot,
      message: `Slot updated successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete parking slot
exports.deleteParkingSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Slot deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};