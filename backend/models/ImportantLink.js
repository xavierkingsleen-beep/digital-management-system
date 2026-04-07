const mongoose = require('mongoose');

const importantLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('ImportantLink', importantLinkSchema);
