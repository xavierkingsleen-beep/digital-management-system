const router = require('express').Router();
const GatePass = require('../models/GatePass');
const AbsenceLog = require('../models/AbsenceLog');
const { protect, adminOnly } = require('../middleware/auth');
const { sendNotification } = require('../utils/sendNotification');
const { getLeaveOverlay } = require('../utils/leaveOverlay');

// Hostel GPS coords + radius
const HOSTEL_LAT = 8.72267;
const HOSTEL_LNG = 77.760906;
const RADIUS_METERS = 250;
const MIN_RETURN_GAP_MS = 10 * 60 * 1000; // 10 minutes

function distanceMeters(lat, lng) {
  return Math.sqrt(Math.pow(lat - HOSTEL_LAT, 2) + Math.pow(lng - HOSTEL_LNG, 2)) * 111000;
}

// ── Admin: get overdue students ───────────────────────────────────────────────
router.get('/overdue', protect, adminOnly, async (req, res) => {
  try {
    // Auto-mark overdue before returning
    await GatePass.updateMany(
      { status: 'Exited', toTime: { $lt: new Date() } },
      { $set: { status: 'Overdue' } }
    );
    const passes = await GatePass.find({ status: { $in: ['Exited', 'Overdue'] } })
      .populate({ path: 'student', select: 'name rollNumber phone roomId', populate: { path: 'roomId', select: 'roomNumber' } })
      .sort('-exitTime');
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin: get currently out students (Exited) ────────────────────────────────
router.get('/out', protect, adminOnly, async (req, res) => {
  try {
    const passes = await GatePass.find({ status: { $in: ['Exited', 'Overdue'] } })
      .populate({ path: 'student', select: 'name rollNumber roomId', populate: { path: 'roomId', select: 'roomNumber' } });
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Student: get own gate passes ──────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const passes = await GatePass.find({ student: req.user._id }).sort('-createdAt');
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Student: request gate pass ────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { reason, fromTime, toTime } = req.body;
    if (!reason || !fromTime || !toTime)
      return res.status(400).json({ message: 'All fields are required' });
    if (new Date(toTime) <= new Date(fromTime))
      return res.status(400).json({ message: 'Return time must be after exit time' });

    const existing = await GatePass.findOne({
      student: req.user._id,
      status: { $in: ['Pending', 'Approved', 'Exited', 'Overdue'] },
    });
    if (existing)
      return res.status(400).json({ message: 'You already have an active or pending gate pass' });

    const pass = await GatePass.create({ student: req.user._id, reason, fromTime, toTime });
    res.status(201).json(pass);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin: get all gate passes ────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const passes = await GatePass.find()
      .populate({ path: 'student', select: 'name rollNumber roomId', populate: { path: 'roomId', select: 'roomNumber' } })
      .sort('-createdAt');
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin: approve or reject ──────────────────────────────────────────────────
router.put('/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    if (!['Approved', 'Rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const pass = await GatePass.findById(req.params.id);
    if (!pass) return res.status(404).json({ message: 'Gate pass not found' });
    if (pass.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending passes can be reviewed' });

    pass.status = status;
    pass.adminRemark = adminRemark || '';
    pass.approvedBy = req.user._id;
    await pass.save();

    // Notify student — fire-and-forget
    const io = req.app.get('io');
    sendNotification(io, {
      userId: pass.student,
      title: `Gate Pass ${status}`,
      message: status === 'Approved'
        ? 'Your gate pass has been approved. You may now mark your exit.'
        : `Your gate pass was rejected.${adminRemark ? ` Reason: ${adminRemark}` : ''}`,
      type: status === 'Approved' ? 'success' : 'warning',
      actionUrl: '/student/gatepass',
    }).catch(() => {});

    res.json(pass);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Student: mark exit (GPS validated) ───────────────────────────────────────
router.put('/:id/exit', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ message: 'Location is required to mark exit' });

    const dist = distanceMeters(latitude, longitude);
    if (dist > RADIUS_METERS)
      return res.status(400).json({ message: 'You must be inside hostel to mark exit' });

    const pass = await GatePass.findOne({ _id: req.params.id, student: req.user._id });
    if (!pass) return res.status(404).json({ message: 'Gate pass not found' });
    if (pass.status !== 'Approved')
      return res.status(400).json({ message: 'Gate pass must be Approved before marking exit' });

    // Leave overlay block — student cannot exit while on approved leave
    const { onLeave } = await getLeaveOverlay(req.user._id);
    if (onLeave)
      return res.status(400).json({ message: 'You are on leave. Gate pass exit is disabled during approved leave.' });

    pass.status = 'Exited';
    pass.exitTime = new Date();
    await pass.save();

    // Create absence log — student is now OUTSIDE
    await AbsenceLog.create({
      student: req.user._id,
      date: pass.exitTime.toISOString().split('T')[0],
      gatePass: pass._id,
      fromTime: pass.exitTime,
      toTime: null,
    });

    res.json(pass);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Student: mark return (GPS + 10 min gap validated) ────────────────────────
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ message: 'Location is required to mark return' });

    const dist = distanceMeters(latitude, longitude);
    if (dist > RADIUS_METERS)
      return res.status(400).json({ message: 'You are not inside hostel' });

    const pass = await GatePass.findOne({ _id: req.params.id, student: req.user._id });
    if (!pass) return res.status(404).json({ message: 'Gate pass not found' });
    if (!['Exited', 'Overdue'].includes(pass.status))
      return res.status(400).json({ message: 'You must be exited to mark return' });

    const now = new Date();
    const gap = now - new Date(pass.exitTime);
    if (gap < MIN_RETURN_GAP_MS) {
      const waitMin = Math.ceil((MIN_RETURN_GAP_MS - gap) / 60000);
      return res.status(400).json({ message: `Too early to return. Please wait ${waitMin} more minute(s)` });
    }

    pass.status = 'Returned';
    pass.returnTime = now;
    pass.isLate = now > new Date(pass.toTime);
    await pass.save();

    // Close the open absence log for this gate pass
    await AbsenceLog.findOneAndUpdate(
      { gatePass: pass._id, toTime: null },
      { $set: { toTime: now } }
    );

    res.json(pass);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Sync overdue (can be called by admin or cron) ─────────────────────────────
router.post('/sync-overdue', protect, adminOnly, async (req, res) => {
  try {
    // Find passes that are about to be marked overdue (before update)
    const toMark = await GatePass.find({
      status: 'Exited',
      toTime: { $lt: new Date() },
    }).select('student');

    const result = await GatePass.updateMany(
      { status: 'Exited', toTime: { $lt: new Date() } },
      { $set: { status: 'Overdue' } }
    );

    // Notify each affected student — fire-and-forget
    if (toMark.length > 0) {
      const io = req.app.get('io');
      for (const pass of toMark) {
        sendNotification(io, {
          userId: pass.student,
          title: 'Gate Pass Overdue',
          message: 'Your expected return time has passed. Please return to hostel immediately.',
          type: 'warning',
          actionUrl: '/student/gatepass',
        }).catch(() => {});
      }
    }

    res.json({ updated: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
