const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HostelFee = require('../models/HostelFee');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Student Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, registerNumber, phone, parentPhone, bloodGroup, department, year } = req.body;
    if (!name || !email || !password || !rollNumber || !registerNumber)
      return res.status(400).json({ message: 'Please fill all required fields' });
    const exists = await User.findOne({ email });
    if (exists) {
      // Allow re-registration only if previously rejected
      if (exists.status === 'REJECTED') {
        await User.findByIdAndUpdate(exists._id, {
          name, password: require('bcryptjs').hashSync(password, 10),
          rollNumber, registerNumber, phone, parentPhone, bloodGroup, department, year,
          status: 'PENDING',
        });
        return res.status(201).json({ message: 'Re-registration successful. Waiting for admin approval.' });
      }
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, rollNumber, registerNumber, phone, parentPhone, bloodGroup, department, year, role: 'student', status: 'PENDING' });
    res.status(201).json({ message: 'Registration successful. Waiting for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login (both student and admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    // Status check for students (admins always allowed)
    if (user.role === 'student') {
      const st = user.status || 'APPROVED';
      if (st === 'PENDING')   return res.status(403).json({ message: 'Your account is waiting for admin approval' });
      if (st === 'REJECTED')  return res.status(403).json({ message: 'Your account has been rejected. Contact admin' });

      // Device binding check
      const { deviceId } = req.body;
      if (user.deviceId) {
        // Device already bound — check if it matches
        if (deviceId && user.deviceId !== deviceId) {
          return res.status(403).json({
            message: 'Login blocked: unrecognized device. Contact admin to reset your device.',
            deviceBlocked: true,
          });
        }
      } else if (deviceId) {
        // First login — bind this device
        await User.findByIdAndUpdate(user._id, { deviceId });
      }
    }
    res.json({ token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('roomId').select('-password');
  const obj = user.toObject();
  const hasPaid = await HostelFee.exists({ student: user._id, status: 'Paid' });
  obj.feeStatus = hasPaid ? 'Paid' : 'Pending';
  res.json(obj);
});

// Update current user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['phone', 'parentPhone', 'bloodGroup', 'department', 'year'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).populate('roomId').select('-password');
    const obj = user.toObject();
    const hasPaid = await HostelFee.exists({ student: user._id, status: 'Paid' });
    obj.feeStatus = hasPaid ? 'Paid' : 'Pending';
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
