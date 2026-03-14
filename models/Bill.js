const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coachingName: { type: String, required: true },
  description: { type: String, required: true },
  pages: { type: Number, required: true },
  pricePerPage: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', billSchema);
