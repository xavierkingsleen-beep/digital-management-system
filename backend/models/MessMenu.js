const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
  day: { type: String, required: true, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  breakfast: { type: String },
  lunch: { type: String },
  snacks: { type: String },
  dinner: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);
