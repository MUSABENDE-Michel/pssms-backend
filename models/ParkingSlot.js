const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  slotStatus: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
    default: 'Available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slot number before saving
parkingSlotSchema.pre('save', async function(next) {
  try {
    // Only generate if this is a new document and slotNumber is not provided
    if (this.isNew && (!this.slotNumber || this.slotNumber === '')) {
      // Find the maximum slot number
      const allSlots = await this.constructor.find({}, 'slotNumber').sort({ slotNumber: 1 });
      
      let nextNumber = 1;
      const usedNumbers = new Set();
      
      // Extract numbers from existing slots
      for (const slot of allSlots) {
        if (slot.slotNumber) {
          const match = slot.slotNumber.match(/\d+/);
          if (match) {
            usedNumbers.add(parseInt(match[0]));
          }
        }
      }
      
      // Find the smallest unused number starting from 1
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      
      this.slotNumber = `A${nextNumber}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);