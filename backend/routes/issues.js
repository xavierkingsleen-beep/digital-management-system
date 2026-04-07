const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const Issue = require('../models/Issue');
const { protect, adminOnly } = require('../middleware/auth');
const { sendNotification } = require('../utils/sendNotification');

// Multer config — save to /uploads/complaints/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/complaints'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only image files are allowed (jpg, png, webp)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Student: raise issue (multipart/form-data)
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const { category, description, location, priority } = req.body;
    if (!category || !description)
      return res.status(400).json({ message: 'Category and description are required' });

    const photoPath = req.file ? `/uploads/complaints/${req.file.filename}` : '';

    const issue = await Issue.create({
      student: req.user._id,
      category,
      description,
      location: location || '',
      priority: priority || 'Medium',
      photo: photoPath,
    });
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get own issues
router.get('/my', protect, async (req, res) => {
  try {
    const issues = await Issue.find({ student: req.user._id }).sort('-createdAt');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all issues
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('student', 'name rollNumber roomId')
      .sort('-createdAt');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update status and response
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Notify student — fire-and-forget
    const io = req.app.get('io');
    const isResolved = status === 'Resolved';
    sendNotification(io, {
      userId: issue.student,
      title: `Complaint ${status}`,
      message: isResolved
        ? `Your complaint "${issue.category}" has been resolved.${adminResponse ? ` Response: ${adminResponse}` : ''}`
        : `Your complaint "${issue.category}" is now ${status}.`,
      type: isResolved ? 'success' : 'info',
      actionUrl: '/student/complaints',
    }).catch(() => {});

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
