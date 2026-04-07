const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.connection.collection('users').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'APPROVED' } }
  );
  console.log('Migrated:', result.modifiedCount, 'users set to APPROVED');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
