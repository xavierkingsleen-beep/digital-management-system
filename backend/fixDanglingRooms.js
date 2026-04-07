const mongoose = require('mongoose');
require('dotenv').config();

async function fixDanglingRoomRefs() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const db = mongoose.connection;

  // 1. Get all valid room IDs
  const validRooms = await db.collection('rooms').distinct('_id');
  const validRoomIds = new Set(validRooms.map(id => id.toString()));

  // 2. Find users with a non-null roomId
  const usersWithRoom = await db.collection('users')
    .find({ roomId: { $ne: null } }, { projection: { _id: 1, name: 1, roomId: 1 } })
    .toArray();

  // 3. Filter those whose roomId doesn't exist in rooms collection
  const dangling = usersWithRoom.filter(u => !validRoomIds.has(u.roomId?.toString()));

  if (dangling.length === 0) {
    console.log('No dangling room references found. Database is clean.');
    process.exit(0);
  }

  const danglingIds = dangling.map(u => u._id);

  // 4. Fix: set roomId = null for those users only
  const result = await db.collection('users').updateMany(
    { _id: { $in: danglingIds } },
    { $set: { roomId: null } }
  );

  console.log(`\nFixed ${result.modifiedCount} user(s) with dangling roomId references:\n`);
  dangling.forEach(u => {
    console.log(`  - User: ${u.name || 'N/A'} | ID: ${u._id} | Bad roomId: ${u.roomId}`);
  });

  process.exit(0);
}

fixDanglingRoomRefs().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
