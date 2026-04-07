const router = require('express').Router();
const Attendance = require('../models/Attendance');
const AbsenceLog = require('../models/AbsenceLog');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { getLeaveOverlay } = require('../utils/leaveOverlay');

// Attendance window: 6AM – 10PM
const WINDOW_START = 6;
const WINDOW_END = 22;

function inWindow() {
  const h = new Date().getHours();
  return h >= WINDOW_START && h < WINDOW_END;
}

// ── Student: mark attendance (GPS + window check) ────────────────────────────
router.post('/mark', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ message: 'latitude and longitude are required' });
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90)
      return res.status(400).json({ message: 'latitude must be a number between -90 and 90' });
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180)
      return res.status(400).json({ message: 'longitude must be a number between -180 and 180' });

    if (!inWindow())
      return res.status(400).json({ message: 'Attendance window closed (6:00 AM – 10:00 PM only)' });

    // Leave overlay check — block marking if student is on approved leave
    const { onLeave } = await getLeaveOverlay(req.user._id);
    if (onLeave)
      return res.status(400).json({ message: 'You are currently on approved leave. Attendance marking is not available.' });

    const dist = Math.sqrt(
      Math.pow(latitude - 8.72267, 2) + Math.pow(longitude - 77.760906, 2)
    ) * 111000;
    if (dist > 250)
      return res.status(400).json({ message: 'You must be within hostel campus to mark attendance' });

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isWeekend = [0, 6].includes(now.getDay());
    const studentDoc = await User.findById(req.user._id).select('roomId');

    // Use 'morning' slot as the single daily confirmation slot (backward compat)
    const existing = await Attendance.findOne({ student: req.user._id, date: today, slot: 'morning' });
    if (existing)
      return res.status(400).json({ message: 'Attendance already confirmed for today' });

    const record = await Attendance.create({
      student: req.user._id,
      date: today,
      slot: 'morning',
      status: 'Present',
      markedAt: now,
      isWeekend,
      room: studentDoc?.roomId || null,
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: get own attendance ───────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).sort('-date');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: get today's unified status ──────────────────────────────────────
router.get('/today-status', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Leave overlay — checked first, pure read, no DB writes
    const { onLeave, leave } = await getLeaveOverlay(req.user._id);
    if (onLeave) {
      return res.json({
        currentStatus: 'ON_LEAVE',
        onLeave: true,
        leaveType: leave.leaveType,
        leaveEnd: leave.endDate,
        confirmedPresent: false,
        confirmedAt: null,
        windowOpen: inWindow(),
        openAbsence: null,
        absenceLogs: [],
        totalAbsentMinutes: 0,
      });
    }

    // Normal attendance logic (unchanged)
    const confirmed = await Attendance.findOne({ student: req.user._id, date: today, status: 'Present' });
    const openAbsence = await AbsenceLog.findOne({ student: req.user._id, toTime: null });
    const absenceLogs = await AbsenceLog.find({ student: req.user._id, date: today }).sort('fromTime');

    const now = new Date();
    let totalAbsentMs = 0;
    for (const log of absenceLogs) {
      const end = log.toTime ? new Date(log.toTime) : now;
      totalAbsentMs += Math.max(0, end - new Date(log.fromTime));
    }

    res.json({
      currentStatus: openAbsence ? 'OUTSIDE' : 'INSIDE',
      onLeave: false,
      confirmedPresent: !!confirmed,
      confirmedAt: confirmed?.markedAt || null,
      windowOpen: inWindow(),
      openAbsence: openAbsence || null,
      absenceLogs,
      totalAbsentMinutes: Math.round(totalAbsentMs / 60000),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: get today's slot status (backward compat) ───────────────────────
router.get('/today-slots', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ student: req.user._id, date: today });
    res.json({
      morning: records.find(r => r.slot === 'morning') || null,
      evening: records.find(r => r.slot === 'evening') || null,
      currentSlot: inWindow() ? 'morning' : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: daily attendance with slot breakdown (backward compat) ─────────────
router.get('/daily', protect, adminOnly, async (req, res) => {
  try {
    const { date, slot } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const allStudents = await User.find({ role: 'student', status: 'APPROVED' })
      .select('name rollNumber roomId')
      .populate('roomId', 'roomNumber');

    // Get all attendance records for that date (optionally filter by slot)
    const query = { date: targetDate, status: 'Present' };
    if (slot && (slot === 'morning' || slot === 'evening')) query.slot = slot;

    const presentRecords = await Attendance.find(query).select('student slot');

    // Build per-student slot map
    const slotMap = {};
    presentRecords.forEach(r => {
      const sid = r.student.toString();
      if (!slotMap[sid]) slotMap[sid] = [];
      slotMap[sid].push(r.slot);
    });

    const result = allStudents.map(s => {
      const sid = s._id.toString();
      const slots = slotMap[sid] || [];
      return {
        ...s.toObject(),
        morningStatus: slots.includes('morning') ? 'Present' : 'Absent',
        eveningStatus: slots.includes('evening') ? 'Present' : 'Absent',
        // backward-compat: present if either slot is present
        attendanceStatus: slots.length > 0 ? 'Present' : 'Absent',
      };
    });

    res.json({ date: targetDate, records: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: weekend attendance ─────────────────────────────────────────────────
router.get('/weekend', protect, adminOnly, async (req, res) => {
  try {
    const records = await Attendance.find({ isWeekend: true })
      .populate('student', 'name rollNumber')
      .sort('-date');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: unified daily status with absence logs ─────────────────────────────
router.get('/daily-unified', protect, adminOnly, async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const allStudents = await User.find({ role: 'student', status: 'APPROVED' })
      .select('name rollNumber phone roomId')
      .populate('roomId', 'roomNumber');

    // Get absence logs for the date
    const absenceLogs = await AbsenceLog.find({ date: targetDate })
      .populate('student', '_id');

    // Build absence map per student
    const absenceMap = {};
    absenceLogs.forEach(log => {
      const sid = log.student?._id?.toString() || log.student?.toString();
      if (!absenceMap[sid]) absenceMap[sid] = [];
      absenceMap[sid].push(log);
    });

    // Get manual confirmations
    const confirmed = await Attendance.find({ date: targetDate, status: 'Present' }).select('student');
    const confirmedSet = new Set(confirmed.map(r => r.student.toString()));

    // Currently outside (open absence log)
    const openLogs = await AbsenceLog.find({ toTime: null }).select('student');
    const outsideSet = new Set(openLogs.map(r => r.student.toString()));

    // Leave overlay — find all students currently on approved leave (pure read)
    const nowForLeave = new Date();
    const todayStr = targetDate;
    const LeaveRequest = require('../models/LeaveRequest');
    const activeLeaves = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $lte: nowForLeave },
      endDate:   { $gte: nowForLeave },
    }).select('student startDate endDate leaveType').catch(() => []);

    const onLeaveSet = new Set();
    for (const lv of activeLeaves) {
      const leaveStart = new Date(lv.startDate);
      leaveStart.setHours(6, 0, 0, 0);
      const leaveEnd = new Date(lv.endDate);
      leaveEnd.setHours(22, 0, 0, 0);
      if (nowForLeave >= leaveStart && nowForLeave <= leaveEnd) {
        onLeaveSet.add(lv.student.toString());
      }
    }

    const now = new Date();
    const result = allStudents.map(s => {
      const sid = s._id.toString();
      const logs = absenceMap[sid] || [];
      let totalAbsentMs = 0;
      logs.forEach(log => {
        const end = log.toTime ? new Date(log.toTime) : now;
        totalAbsentMs += Math.max(0, end - new Date(log.fromTime));
      });
      return {
        ...s.toObject(),
        currentStatus: onLeaveSet.has(sid) ? 'ON_LEAVE' : outsideSet.has(sid) ? 'OUTSIDE' : 'INSIDE',
        onLeave: onLeaveSet.has(sid),
        confirmedPresent: confirmedSet.has(sid),
        absenceLogs: logs,
        totalAbsentMinutes: Math.round(totalAbsentMs / 60000),
        attendanceStatus: onLeaveSet.has(sid) ? 'On Leave' : outsideSet.has(sid) ? 'Absent' : 'Present',
      };
    });

    res.json({ date: targetDate, records: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: get own absence logs ─────────────────────────────────────────────
router.get('/absence-logs', protect, async (req, res) => {
  try {
    const logs = await AbsenceLog.find({ student: req.user._id })
      .sort('-fromTime')
      .limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
