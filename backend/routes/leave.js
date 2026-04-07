const router = require('express').Router();
const LeaveRequest = require('../models/LeaveRequest');
const { protect, adminOnly } = require('../middleware/auth');
const { sendNotification } = require('../utils/sendNotification');

// Student: apply leave
router.post('/', protect, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, parentContact } = req.body;
    if (!startDate || !endDate || !reason || !parentContact)
      return res.status(400).json({ message: 'All fields are required' });
    if (new Date(endDate) < new Date(startDate))
      return res.status(400).json({ message: 'End date cannot be before start date' });
    const leave = await LeaveRequest.create({ student: req.user._id, leaveType, startDate, endDate, reason, parentContact });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get own leaves
router.get('/my', protect, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ student: req.user._id }).sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all leaves
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('student', 'name rollNumber').sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: approve/reject
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminReason } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, { status, adminReason }, { new: true });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    // Notify student — fire-and-forget, never blocks response
    const io = req.app.get('io');
    const isApproved = status === 'Approved';
    sendNotification(io, {
      userId: leave.student,
      title: `Leave ${status}`,
      message: isApproved
        ? `Your ${leave.leaveType} leave request has been approved.`
        : `Your ${leave.leaveType} leave request was rejected. ${adminReason ? `Reason: ${adminReason}` : ''}`,
      type: isApproved ? 'success' : 'warning',
      actionUrl: '/student/leave',
    }).catch(() => {});

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
