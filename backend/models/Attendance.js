const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },           // YYYY-MM-DD
  slot: { type: String, enum: ['morning', 'evening'], required: true },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
  markedAt: { type: Date },
  isWeekend: { type: Boolean, default: false },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null }, // optional room ref
}, { timestamps: true });

// One record per student per date per slot
attendanceSchema.index({ student: 1, date: 1, slot: 1 }, { unique: true });

// Keep old index drop-safe by not declaring the old unique index
module.exports = mongoose.model('Attendance', attendanceSchema);
