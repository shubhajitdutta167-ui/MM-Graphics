const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

// Download PDF for a bill (customer can only access their own bills)
router.get('/bill/:id/pdf', isCustomer, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.customerId.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill._id}.pdf`);
    doc.pipe(res);

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
      doc.text(`₹${item.pricePerPage}`, col.price, y, { width: 80 });
      doc.text(`₹${item.amount}`, col.amount, y, { width: 75, align: 'right' });
      y += 22;
    });

    // Total
    doc.moveDown(0.5);
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).stroke('#3b82f6');
    y += 10;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Grand Total: ₹${bill.totalAmount}`, col.amount - 100, y, { width: 175, align: 'right' });

    // Footer
    doc.moveDown(4);
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
    doc.text('Thank you for your business!', 50, doc.y, { align: 'center' });
    doc.text('MM Graphics | mmgraphics.nab@gmail.com | +91 7699738819', { align: 'center' });

    doc.end();
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
