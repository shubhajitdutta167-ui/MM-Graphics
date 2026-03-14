const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  pages: { type: Number, required: true },
  pricePerPage: { type: Number, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const billSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coachingName: { type: String, required: true },
  items: { type: [billItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', billSchema);
