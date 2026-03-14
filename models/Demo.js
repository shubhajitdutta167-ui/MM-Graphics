const mongoose = require('mongoose');

const demoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Demo', demoSchema);
