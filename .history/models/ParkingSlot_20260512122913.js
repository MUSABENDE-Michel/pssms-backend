const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,  // Changed from String to Number for auto-increment
    unique: true,
    required: true
  },
  slotName: {
    type: String,  // Optional: A1, B2, etc. format
    unique: true,
    uppercase: true
  },
  slotStatus: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
    default: 'Available'
  },
  slotType: {
    type: String,
    enum: ['Standard', 'VIP', 'Handicap', 'Electric', 'Motorcycle'],
    default: 'Standard'
  },
  floor: {
    type: String,
    default: 'Ground'
  },
  hourlyRate: {
    type: Number,
    default: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slot number before saving
parkingSlotSchema.pre('save', async function(next) {
  if (this.isNew && !this.slotNumber) {
    const lastSlot = await this.constructor.findOne({}, {}, { sort: { 'slotNumber': -1 } });
    this.slotNumber = lastSlot ? lastSlot.slotNumber + 1 : 1;
    
    // Also generate formatted name (e.g., S001, P001, Slot-001)
    this.slotName = `Slot-${String(this.slotNumber).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);