const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  timestamp: { type: Date, default: Date.now },
  read:      { type: Boolean, default: false },
  actionUrl: { type: String, required: true },
}, { timestamps: true });

notificationSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
