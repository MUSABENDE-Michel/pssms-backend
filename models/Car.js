const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9\s]{3,15}$/, 'Please enter a valid plate number']
  },
  driverName: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
    minlength: [2, 'Driver name must be at least 2 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', carSchema);