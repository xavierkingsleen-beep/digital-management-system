const mongoose = require('mongoose');

const hostelFeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  roomFee: { type: Number, default: 0 },
  messFee: { type: Number, default: 0 },
  maintenanceFee: { type: Number, default: 0 },
  electricityFee: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  // --- extended fields (backward-compatible, all have defaults) ---
  fineAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue', 'Partial'],
    default: 'Pending',
  },
  // keep old status field so existing code still works
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  dueDate: { type: Date },
  paidAt: { type: Date },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTemplate', default: null },
  paymentId: { type: String, default: '' },   // Razorpay payment_id after successful payment
}, { timestamps: true });

module.exports = mongoose.model('HostelFee', hostelFeeSchema);
