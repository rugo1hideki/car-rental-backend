const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const CarModelSchema = new Schema({
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  rentalPrice: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  engineType: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  }
}, { collection: 'cars' });

module.exports = CarModel = mongoose.model('carmodel', CarModelSchema);
