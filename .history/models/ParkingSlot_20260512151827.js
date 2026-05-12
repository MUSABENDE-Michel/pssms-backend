const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: [true, 'Slot number is required'],
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
    if (this.isNew && !this.slotNumber) {
      // Find the last slot to get the highest number
      const lastSlot = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
      
      if (lastSlot && lastSlot.slotNumber) {
        // Extract number from slotNumber (e.g., "A1" -> 1, "B2" -> 2)
        const lastNumber = parseInt(lastSlot.slotNumber.match(/\d+/));
        const nextNumber = lastNumber + 1;
        this.slotNumber = `A${nextNumber}`;
      } else {
        this.slotNumber = 'A1';
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);