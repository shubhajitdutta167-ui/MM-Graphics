const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bill = require('../models/Bill');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const isAdmin = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied. No token provided.');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).send('Access denied. Admin only.');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
};

// Get all customers (coaching centers)
router.get('/customers', isAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new bill
router.post('/bill', isAdmin, async (req, res) => {
  try {
    const { customerId, coachingName, description, pages, pricePerPage, month, year } = req.body;
    const totalAmount = pages * pricePerPage;
    const bill = new Bill({ customerId, coachingName, description, pages, pricePerPage, totalAmount, month, year });
    await bill.save();
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bills
router.get('/bills', isAdmin, async (req, res) => {
  try {
    const bills = await Bill.find().sort({ date: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Stats: Daily, Monthly, Yearly
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Stats for Today (simplified by check for today's date)
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const dailyBills = await Bill.find({ date: { $gte: startOfToday } });
    const dailyTotal = dailyBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    // Stats for Monthly (filter by month & year)
    const monthlyBills = await Bill.find({ month, year });
    const monthlyTotal = monthlyBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    // Stats for Yearly (filter by year)
    const yearlyBills = await Bill.find({ year });
    const yearlyTotal = yearlyBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    res.json({ dailyTotal, monthlyTotal, yearlyTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
