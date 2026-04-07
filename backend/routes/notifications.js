const router = require('express').Router();
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');
const { sendPushToUser } = require('./push');
const { sendNotificationEmail } = require('../utils/mailer');
const User = require('../models/User');

// POST /notifications — create a notification (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { userId, title, message, type, actionUrl } = req.body;

    if (!userId || !title || !message || !actionUrl)
      return res.status(400).json({ message: 'userId, title, message, and actionUrl are required' });

    const notification = await Notification.create({ userId, title, message, type, actionUrl });

    // Emit real-time event to the target user's room
    const io = req.app.get('io');
    if (io) io.to(`user:${userId}`).emit('new_notification', notification);

    // Send browser push notification (best-effort, non-blocking)
    sendPushToUser(userId, {
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      type: notification.type,
    }).catch(() => { });

    // Send email for 'warning' type only — runs async, never blocks response
    if (notification.type === 'warning') {
      User.findById(userId).select('email name').then(u => {
        if (u?.email) {
          sendNotificationEmail(u.email, u.name, {
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            type: notification.type,
          }).catch(() => { }); // silent — email failure must not affect API
        }
      }).catch(() => { });
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /notifications/:userId — get all notifications for a user (latest first)
router.get('/:userId', protect, async (req, res) => {
  try {
    // Students can only read their own notifications
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.userId)
      return res.status(403).json({ message: 'Access denied' });

    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ timestamp: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /notifications/:id/read — mark one notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ message: 'Notification not found' });

    // Ensure student can only mark their own notifications
    if (req.user.role === 'student' && notification.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /notifications/read-all/:userId — mark all notifications as read for a user
router.patch('/read-all/:userId', protect, async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.userId)
      return res.status(403).json({ message: 'Access denied' });

    const result = await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: `${result.modifiedCount} notification(s) marked as read` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
