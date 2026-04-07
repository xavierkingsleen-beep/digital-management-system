const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['Water Problem', 'Electricity Issue', 'Room Maintenance', 'Internet Issue', 'Ragging', 'Play Equipment', 'Tables/Chairs Broke', 'Working Staff', 'Hostel Student', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  location: { type: String, default: '' },       // room number / location
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  photo: { type: String, default: '' },           // stored file path
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  adminResponse: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
