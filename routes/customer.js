const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Demo = require('../models/Demo');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const isCustomer = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied. No token provided.');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'customer') return res.status(403).send('Access denied. Customer only.');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
};

// Get my billing history
router.get('/my-bills', isCustomer, async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.user.id }).sort({ date: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View all work demos (public)
router.get('/demos', async (req, res) => {
  try {
    const demos = await Demo.find().sort({ createdAt: -1 });
    res.json(demos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
