const ParkingSlot = require('../models/ParkingSlot');

// Get all parking slots
exports.getParkingSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort('slotNumber');
    
    res.status(200).json({
      success: true,
      data: slots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create multiple parking slots in bulk
exports.createBulkParkingSlots = async (req, res) => {
  try {
    const { count, startFrom = 1, slotType = 'Standard', floor = 'Ground' } = req.body;
    
    const slots = [];
    for (let i = 0; i < count; i++) {
      const slotNumber = startFrom + i;
      const slot = await ParkingSlot.create({
        slotNumber,
        slotType,
        floor,
        slotStatus: 'Available'
      });
      slots.push(slot);
    }
    
    res.status(201).json({
      success: true,
      message: `${count} parking slots created successfully`,
      data: slots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create single parking slot
exports.createParkingSlot = async (req, res) => {
  try {
    const { slotType, floor, hourlyRate } = req.body;
    
    // Get the last slot number
    const lastSlot = await ParkingSlot.findOne({}, {}, { sort: { 'slotNumber': -1 } });
    const nextSlotNumber = lastSlot ? lastSlot.slotNumber + 1 : 1;
    
    const slot = await ParkingSlot.create({
      slotNumber: nextSlotNumber,
      slotType: slotType || 'Standard',
      floor: floor || 'Ground',
      hourlyRate: hourlyRate || 500,
      slotStatus: 'Available'
    });
    
    res.status(201).json({
      success: true,
      data: slot,
      message: `Slot ${slot.slotName} created successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update parking slot
exports.updateParkingSlot = async (req, res) => {
  try {
    const { slotType, slotStatus, floor, hourlyRate } = req.body;
    
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { slotType, slotStatus, floor, hourlyRate },
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
      data: slot
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
      message: `Slot ${slot.slotName} deleted successfully`
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
        slotsByType,
        slotsByFloor
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};