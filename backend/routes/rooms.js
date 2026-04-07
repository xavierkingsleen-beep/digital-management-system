const router = require('express').Router();
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Student: get own room with roommates populated
router.get('/my', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('roomId');
    if (!user?.roomId) return res.status(404).json({ message: 'No room assigned' });
    const room = await Room.findById(user.roomId).populate('students', 'name rollNumber department year');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find().populate('students', 'name rollNumber');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create room
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { roomNumber, capacity, floor, type } = req.body;
    const exists = await Room.findOne({ roomNumber });
    if (exists) return res.status(400).json({ message: 'Room already exists' });
    const room = await Room.create({ roomNumber, capacity, floor, type });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign student to room
router.put('/:id/assign', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.students.length >= room.capacity)
      return res.status(400).json({ message: 'Room is full' });

    // Race condition fix: check if student is already assigned to ANY room
    const student = await User.findById(studentId).select('roomId status');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const st = student.status || 'APPROVED';
    if (st !== 'APPROVED') return res.status(400).json({ message: 'Only approved students can be assigned to rooms' });
    if (student.roomId && student.roomId.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Student is already assigned to another room. Remove them first.' });
    }

    if (!room.students.map(s => s.toString()).includes(studentId)) {
      room.students.push(studentId);
      // Transaction fix: save room first, then update user; rollback room if user update fails
      await room.save();
      try {
        await User.findByIdAndUpdate(studentId, { roomId: room._id });
      } catch (userErr) {
        // Rollback room change
        room.students = room.students.filter(s => s.toString() !== studentId);
        await room.save();
        throw userErr;
      }
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove student from room
router.put('/:id/remove', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.students = room.students.filter(s => s.toString() !== studentId);
    await room.save();
    try {
      await User.findByIdAndUpdate(studentId, { roomId: null });
    } catch (userErr) {
      // Rollback: re-add student to room
      room.students.push(studentId);
      await room.save();
      throw userErr;
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete room
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    // Cascade fix: clear roomId from all assigned students before deleting
    if (room.students.length > 0) {
      await User.updateMany(
        { _id: { $in: room.students } },
        { $set: { roomId: null } }
      );
    }
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
