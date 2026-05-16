const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  action:       { type: String, enum: ['login','upload','download','update','create','delete','enable_c2'], required: true },
  description:  { type: String },
  relatedLead:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  meta:         { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
