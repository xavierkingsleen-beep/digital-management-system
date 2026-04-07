const mongoose = require('mongoose');

const notificationConfigSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true }, // e.g. "Attendance Reminder"
  enabled:    { type: Boolean, default: true },
  times:      { type: [String], default: [] },  // ["09:00", "15:00"] — HH:mm 24h format
  targetRole: { type: String, enum: ['student', 'admin', 'all'], default: 'student' },
  message:    { type: String, required: true },
  actionUrl:  { type: String, required: true },
  type:       { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
}, { timestamps: true });

module.exports = mongoose.model('NotificationConfig', notificationConfigSchema);
