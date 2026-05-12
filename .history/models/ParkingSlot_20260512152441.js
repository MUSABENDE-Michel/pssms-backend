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
      // Count total documents to determine next number
      const count = await this.constructor.countDocuments();
      const nextNumber = count + 1;
      this.slotNumber = `A${nextNumber}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);