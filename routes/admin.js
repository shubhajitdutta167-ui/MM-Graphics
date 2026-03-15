const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

// Update customer drive link and visibility flag
router.patch('/customer/:id/drive-link', isAdmin, async (req, res) => {
  try {
    const { driveLink, driveShowLink } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { driveLink, driveShowLink },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new bill
router.post('/bill', isAdmin, async (req, res) => {
  try {
    const { customerId, coachingName, items, month, year } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'At least one item is required' });

    const processedItems = items.map(item => ({
      description: item.description,
      pages: Number(item.pages),
      pricePerPage: Number(item.pricePerPage),
      amount: Number(item.pages) * Number(item.pricePerPage)
    }));
    const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

    const bill = new Bill({ customerId, coachingName, items: processedItems, totalAmount, month, year });
    await bill.save();
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate PDF for a bill
router.get('/bill/:id/pdf', isAdmin, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    await new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bill-${bill._id}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
        resolve();
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('MM Graphics', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Professional Typing & Document Services', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#3b82f6');
      doc.moveDown(1);

      // Bill info
      doc.fontSize(11).font('Helvetica-Bold').text('INVOICE', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Customer: ${bill.coachingName}`);
      doc.text(`Period: ${monthNames[bill.month - 1]} ${bill.year}`);
      doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`);
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const col = { num: 50, desc: 80, pages: 300, price: 380, amount: 470 };
      doc.font('Helvetica-Bold').fontSize(10);
      doc.rect(50, tableTop - 5, 495, 20).fill('#3b82f6');
      doc.fillColor('#ffffff');
      doc.text('#', col.num, tableTop, { width: 25 });
      doc.text('Description', col.desc, tableTop, { width: 210 });
      doc.text('Pages', col.pages, tableTop, { width: 70 });
      doc.text('Price/Pg', col.price, tableTop, { width: 80 });
      doc.text('Amount', col.amount, tableTop, { width: 75, align: 'right' });

      // Table rows
      doc.font('Helvetica').fontSize(10).fillColor('#000000');
      let y = tableTop + 22;
      bill.items.forEach((item, i) => {
        const bgColor = i % 2 === 0 ? '#f3f4f6' : '#ffffff';
        doc.rect(50, y - 5, 495, 20).fill(bgColor);
        doc.fillColor('#000000');
        doc.text(`${i + 1}`, col.num, y, { width: 25 });
        doc.text(item.description, col.desc, y, { width: 210 });
        doc.text(`${item.pages}`, col.pages, y, { width: 70 });
        doc.text(`Rs.${Math.round(item.pricePerPage)}`, col.price, y, { width: 80 });
        doc.text(`Rs.${Math.round(item.amount)}`, col.amount, y, { width: 75, align: 'right' });
        y += 22;
      });

      // Total
      doc.moveDown(0.5);
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).stroke('#3b82f6');
      y += 10;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`Grand Total: Rs.${Math.round(bill.totalAmount)}`, col.amount - 100, y, { width: 175, align: 'right' });

      // Footer
      doc.moveDown(4);
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text('Thank you for your business!', 50, doc.y, { align: 'center' });
      doc.text('MM Graphics | mmgraphics.nab@gmail.com | +91 7699738819', { align: 'center' });

      doc.end();
    });
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
