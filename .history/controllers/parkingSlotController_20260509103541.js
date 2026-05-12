const ParkingSlot = require('../models/ParkingSlot');

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

exports.createParkingSlot = async (req, res) => {
  try {
    const { slotNumber, slotStatus } = req.body;
    
    const existingSlot = await ParkingSlot.findOne({ slotNumber: slotNumber.toUpperCase() });
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Parking slot with this number already exists'
      });
    }
    
    const slot = await ParkingSlot.create({
      slotNumber: slotNumber.toUpperCase(),
      slotStatus: slotStatus || 'Available'
    });
    
    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateParkingSlot = async (req, res) => {
  try {
    const { slotNumber, slotStatus } = req.body;
    
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { slotNumber: slotNumber.toUpperCase(), slotStatus },
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
      message: 'Parking slot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};