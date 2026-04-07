const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, required: true },
  available: { type: String, default: '24/7' },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
