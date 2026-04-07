const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  fee: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelFee', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Card', 'Cash', 'Other'], default: 'UPI' },
  transactionId: { type: String, default: '' },   // mock / Razorpay order id
  status: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Success' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
