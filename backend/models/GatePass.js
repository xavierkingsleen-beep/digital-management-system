const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  fromTime: { type: Date, required: true },   // planned exit
  toTime: { type: Date, required: true },     // expected return
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Exited', 'Returned', 'Overdue'],
    default: 'Pending',
  },
  adminRemark: { type: String, default: '' },
  exitTime: { type: Date, default: null },
  returnTime: { type: Date, default: null },
  isLate: { type: Boolean, default: false },   // true if returned after toTime
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('GatePass', gatePassSchema);
