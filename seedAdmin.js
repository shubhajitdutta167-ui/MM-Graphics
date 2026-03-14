const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mm-graphics');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'MM Graphics Admin',
      email: 'admin@mmgraphics.com',
      password: hashedPassword,
      role: 'admin',
      phone: '0000000000'
    });

    await admin.save();
    console.log('Admin user created: admin@mmgraphics.com / admin123');

    // Create Work Demos
    const Demo = require('./models/Demo');
    const demoData = [
      { title: "Handwritten to PDF", description: "Convert complex handwritten notes to clean PDF files.", price: 10, pdfUrl: "#" },
      { title: "Book Copy Typing", description: "Directly typing from old books to modern Word files.", price: 12, pdfUrl: "#" },
      { title: "Exam Paper Creation", description: "Professional layout for coaching center questions.", price: 15, pdfUrl: "#" }
    ];
    
    for (let d of demoData) {
      const exists = await Demo.findOne({ title: d.title });
      if (!exists) await new Demo(d).save();
    }
    console.log('Initial demos created');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
