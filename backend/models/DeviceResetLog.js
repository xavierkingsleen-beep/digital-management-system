const mongoose = require('mongoose');

const deviceResetLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin
  action: { type: String, enum: ['OTP_SENT', 'OTP_VERIFIED', 'RESET_COMPLETE'], required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DeviceResetLog', deviceResetLogSchema);
