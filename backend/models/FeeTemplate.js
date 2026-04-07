const mongoose = require('mongoose');

const feeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },          // e.g. "Semester 1 - 2024"
  semester: { type: String, required: true },
  roomFee: { type: Number, default: 0 },
  messFee: { type: Number, default: 0 },
  maintenanceFee: { type: Number, default: 0 },
  electricityFee: { type: Number, default: 0 },
  fineAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FeeTemplate', feeTemplateSchema);
