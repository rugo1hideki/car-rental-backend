const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const RentalSchema = new Schema({
  carModel: {
    type: Schema.Types.ObjectId,
    ref: 'carmodel',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customer',
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  calculatedCost: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  penalty: {
    type: Number,
    default: 0
  },
  finalCost: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  }
});

module.exports = Rental = mongoose.model('rental', RentalSchema);
