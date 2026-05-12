const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    unique: true,
    required: true
  },
  slotCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  slotName: {
    type: String,
    unique: true
  },
  slotStatus: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Out of Service'],
    default: 'Available'
  },
  slotType: {
    type: String,
    enum: ['Standard', 'VIP', 'Handicap', 'Electric', 'Motorcycle', 'Large Vehicle', 'Bus'],
    default: 'Standard'
  },
  floor: {
    type: String,
    default: 'Ground Floor'
  },
  zone: {
    type: String,
    default: 'Zone A'
  },
  size: {
    type: String,
    default: 'Standard (2.5m x 5.5m)'
  },
  hourlyRate: {
    type: Number,
    default: 500,
    min: 0
  },
  dailyRate: {
    type: Number,
    default: 3000
  },
  monthlyRate: {
    type: Number,
    default: 50000
  },
  features: [{
    type: String
  }],
  occupiedBy: {
    type: String,
    default: null
  },
  occupiedSince: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slot number before saving
parkingSlotSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Get the last slot number
      const lastSlot = await this.constructor.findOne().sort('-slotNumber');
      
      if (lastSlot && lastSlot.slotNumber) {
        this.slotNumber = lastSlot.slotNumber + 1;
      } else {
        this.slotNumber = 1;
      }
      
      // Generate slot code
      const floorCode = {
        'Ground Floor': 'GF',
        'First Floor': 'FF',
        'Second Floor': 'SF',
        'Basement': 'BS',
        'Roof Top': 'RT',
        'VIP Level': 'VL'
      }[this.floor] || 'GF';
      
      const zoneCode = this.zone.replace('Zone ', '');
      this.slotCode = `${floorCode}-${zoneCode}-${String(this.slotNumber).padStart(3, '0')}`;
      
      // Generate slot name
      this.slotName = `Slot ${this.slotNumber} (${this.floor} - ${this.zone})`;
    }
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);