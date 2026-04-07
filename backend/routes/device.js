const router = require('express').Router();
const crypto = require('crypto');
const User = require('../models/User');
const DeviceResetLog = require('../models/DeviceResetLog');
const { protect, adminOnly } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

// ── Admin: send OTP to student for device reset ──────────────────────────────
router.post('/reset-request/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student')
      return res.status(404).json({ message: 'Student not found' });
    if (!student.email)
      return res.status(400).json({ message: 'Student has no email on record' });

    // Rate limit: block if an OTP was sent less than 60 seconds ago
    if (student.deviceOtpExpiry) {
      const otpAge = Date.now() - (new Date(student.deviceOtpExpiry).getTime() - 10 * 60 * 1000);
      if (otpAge < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - otpAge) / 1000);
        return res.status(429).json({ message: `Please wait ${waitSec} seconds before requesting another OTP` });
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await User.findByIdAndUpdate(student._id, { deviceOtp: otp, deviceOtpExpiry: expiry });

    await sendOtpEmail(student.email, student.name, otp);

    await DeviceResetLog.create({
      student: student._id,
      resetBy: req.user._id,
      action: 'OTP_SENT',
      note: `OTP sent to ${student.email}`,
    });

    res.json({ message: `OTP sent to ${student.email}` });
  } catch (err) {
    console.error('Device reset error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── Student: verify OTP and reset device ─────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newDeviceId } = req.body;
    if (!email || !otp || !newDeviceId)
      return res.status(400).json({ message: 'email, otp and newDeviceId are required' });

    const student = await User.findOne({ email, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.deviceOtp || !student.deviceOtpExpiry)
      return res.status(400).json({ message: 'No pending OTP. Ask admin to send a reset.' });

    if (new Date() > new Date(student.deviceOtpExpiry))
      return res.status(400).json({ message: 'OTP has expired. Ask admin to resend.' });

    if (student.deviceOtp !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });

    await User.findByIdAndUpdate(student._id, {
      deviceId: newDeviceId,
      deviceOtp: null,
      deviceOtpExpiry: null,
    });

    await DeviceResetLog.create({
      student: student._id,
      resetBy: student._id, // self-verified
      action: 'RESET_COMPLETE',
      note: `Device bound: ${newDeviceId.substring(0, 16)}...`,
    });

    res.json({ message: 'Device reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: view device reset audit log ───────────────────────────────────────
router.get('/audit-log', protect, adminOnly, async (req, res) => {
  try {
    const logs = await DeviceResetLog.find()
      .populate('student', 'name email rollNumber')
      .populate('resetBy', 'name role')
      .sort('-createdAt')
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: get device status for a student ───────────────────────────────────
router.get('/status/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select('name email deviceId deviceOtpExpiry');
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({
      name: student.name,
      email: student.email,
      hasDevice: !!student.deviceId,
      otpPending: !!(student.deviceOtpExpiry && new Date() < new Date(student.deviceOtpExpiry)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
