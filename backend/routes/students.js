const router = require('express').Router();
const User = require('../models/User');
const HostelFee = require('../models/HostelFee');
const { protect, adminOnly } = require('../middleware/auth');

// Admin: get all students with live fee status from HostelFee
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const filter = { role: 'student' };
    if (req.query.status) {
      // Explicit status filter (e.g. PENDING, REJECTED for admin review)
      if (req.query.status === 'APPROVED') {
        filter.$or = [{ status: 'APPROVED' }, { status: { $exists: false } }];
      } else {
        filter.status = req.query.status;
      }
    } else {
      // No status param → default to APPROVED only (never expose rejected/pending)
      filter.$or = [{ status: 'APPROVED' }, { status: { $exists: false } }];
    }
    const students = await User.find(filter).populate('roomId').select('-password');

    const paidFees = await HostelFee.find({ status: 'Paid' }).distinct('student');
    const paidSet = new Set(paidFees.map(id => id.toString()));

    const result = students.map(s => {
      const obj = s.toObject();
      obj.feeStatus = paidSet.has(s._id.toString()) ? 'Paid' : 'Pending';
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get single student
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).populate('roomId').select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: approve student
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'APPROVED' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student approved', user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: reject student
router.patch('/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'REJECTED' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student rejected', user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
