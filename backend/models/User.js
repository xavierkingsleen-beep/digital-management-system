const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  rollNumber: { type: String },
  registerNumber: { type: String },
  phone: { type: String },
  parentPhone: { type: String },
  bloodGroup: { type: String },
  department: { type: String },
  year: { type: String },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  feeStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  // Note: default is APPROVED for backward compatibility — existing users stay accessible
  // New student registrations will override this to PENDING in the register route
  deviceId: { type: String, default: null },          // bound device fingerprint
  deviceOtp: { type: String, default: null },          // one-time OTP for device reset
  deviceOtpExpiry: { type: Date, default: null },      // OTP expiry (10 min)
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
