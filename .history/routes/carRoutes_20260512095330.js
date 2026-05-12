const express = require('express');
const Car = require('../models/Car');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Get all cars
router.get('/', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = search ? {
      $or: [
        { plateNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const cars = await Car.find(query).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      data: cars
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create car
router.post('/', async (req, res) => {
  try {
    const { plateNumber, driverName, phoneNumber } = req.body;
    
    const existingCar = await Car.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingCar) {
      return res.status(400).json({
        success: false,
        message: 'Car with this plate number already exists'
      });
    }
    
    const car = await Car.create({
      plateNumber: plateNumber.toUpperCase(),
      driverName,
      phoneNumber
    });
    
    res.status(201).json({
      success: true,
      data: car
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update car
router.put('/:id', async (req, res) => {
  try {
    const { plateNumber, driverName, phoneNumber } = req.body;
    
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { 
        plateNumber: plateNumber.toUpperCase(), 
        driverName, 
        phoneNumber 
      },
      { new: true, runValidators: true }
    );
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: car
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete car
router.delete('/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;