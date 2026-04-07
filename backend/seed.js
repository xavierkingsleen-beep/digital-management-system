const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const existing = await User.findOne({ email: 'ramasundar11072006@gmail.com' });
  if (existing) {
    console.log('Admin already exists: ramasundar11072006@gmail.com / ramasundar,2006');
    process.exit(0);
  }

  await User.create({
    name: 'Rama Sundar',
    email: 'ramasundar11072006@gmail.com',
    password: 'ramasundar,2006',
    role: 'admin',
  });

  console.log('✅ Admin created: ramasundar11072006@gmail.com / ramasundar,2006');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
