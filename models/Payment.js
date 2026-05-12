const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  parkingRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingRecord',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Mobile Money', 'Card'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);