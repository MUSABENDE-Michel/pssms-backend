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
    
    res.status(200).json({
      success: true,
      data: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        maintenanceSlots,
        occupancyRate: totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available slots
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
    const { slotNumber, slotStatus } = req.body;
    
    // Check if slot number already exists
    if (slotNumber) {
      const existingSlot = await ParkingSlot.findOne({ slotNumber: slotNumber.toUpperCase() });
      if (existingSlot) {
        return res.status(400).json({
          success: false,
          message: 'Parking slot with this number already exists'
        });
      }
    }
    
    const slot = await ParkingSlot.create({
      slotNumber: slotNumber ? slotNumber.toUpperCase() : undefined,
      slotStatus: slotStatus || 'Available'
    });
    
    res.status(201).json({
      success: true,
      data: slot,
      message: `Parking slot ${slot.slotNumber} created successfully`
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
    const { count, startFrom = 'A1' } = req.body;
    
    const numSlots = parseInt(count);
    if (isNaN(numSlots) || numSlots < 1 || numSlots > 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid count between 1 and 50'
      });
    }
    
    // Get the starting letter and number
    const startLetter = startFrom.match(/[A-Za-z]/)?.[0] || 'A';
    const startNumber = parseInt(startFrom.match(/\d+/)?.[0] || 1);
    
    const slots = [];
    for (let i = 0; i < numSlots; i++) {
      const slotNumber = `${startLetter}${startNumber + i}`;
      
      // Check if slot already exists
      const existingSlot = await ParkingSlot.findOne({ slotNumber });
      if (!existingSlot) {
        const slot = await ParkingSlot.create({
          slotNumber,
          slotStatus: 'Available'
        });
        slots.push(slot);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${slots.length} parking slots created successfully`,
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
    const { slotNumber, slotStatus } = req.body;
    
    const updateData = {};
    if (slotNumber) updateData.slotNumber = slotNumber.toUpperCase();
    if (slotStatus) updateData.slotStatus = slotStatus;
    
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      updateData,
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
      message: `Parking slot ${slot.slotNumber} updated successfully`
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
      message: `Parking slot ${slot.slotNumber} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};