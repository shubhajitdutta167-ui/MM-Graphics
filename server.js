const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mm-graphics')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (to be added)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

// Catch-all route to serve the main HTML file
app.get('/:any', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
