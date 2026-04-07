const mongoose = require('mongoose');

// Stores ABSENT periods driven by gate pass exit/return
// One open log per student at a time (returnTime = null means currently outside)
const absenceLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },       // YYYY-MM-DD of the exit
  gatePass: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', default: null },
  fromTime: { type: Date, required: true },     // exitTime
  toTime: { type: Date, default: null },        // returnTime (null = still outside)
  type: { type: String, default: 'ABSENT' },
}, { timestamps: true });

absenceLogSchema.index({ student: 1, date: 1 });

module.exports = mongoose.model('AbsenceLog', absenceLogSchema);
