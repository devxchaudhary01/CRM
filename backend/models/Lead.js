const mongoose = require('mongoose');

// Outcomes: I=Interested, NI=Not Interested, CB=Call Back, NA=No Answer
const callSchema = new mongoose.Schema({
  date:          { type: Date,   default: null },
  outcome:       { type: String, enum:['I','NI','CB','NA',''], default: '' },
  notes:         { type: String, default: '' },
  doneBy:        { type: mongoose.Schema.Types.ObjectId, ref:'User', default: null },
  scheduledDate: { type: Date,   default: null },  // follow-up scheduled by org_owner
}, { _id: false });

const leadSchema = new mongoose.Schema({
  // ── LOCKED fields (upload only, never editable after) ──
  name:      { type: String, required: true },
  address:   { type: String, default: '' },
  emailId:   { type: String, default: '' },
  contactNo: { type: String, default: '' },

  // ── New product/service columns ──
  product: { type: String, default: '' },
  service: { type: String, default: '' },

  // ── Custom dynamic columns (key-value from org config) ──
  customData: { type: mongoose.Schema.Types.Mixed, default: {} },

  // ── Organization ──
  organization: { type: mongoose.Schema.Types.ObjectId, ref:'Organization', required: true },
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User', required: true },
  uploadDate:   { type: Date, default: Date.now },

  // ── Call chain: C1, C2 (optional), C3 (optional) ──
  c1: { type: callSchema, default: () => ({}) },
  c2: { type: callSchema, default: () => ({}) },
  c3: { type: callSchema, default: () => ({}) },
  c2Enabled: { type: Boolean, default: false },
  c3Enabled: { type: Boolean, default: false },

  // Follow-up date set by org_owner after first call
  followUpDate:      { type: Date, default: null },
  followUpSetBy:     { type: mongoose.Schema.Types.ObjectId, ref:'User', default: null },

  // Status — 3 main states + call-progress states
  // pending → in_progress → converted / not_converted
  status: {
    type: String,
    enum: ['pending','in_progress','converted','not_converted'],
    default: 'pending'
  },

  lastWorkedBy: { type: mongoose.Schema.Types.ObjectId, ref:'User', default: null },
  lastWorkedAt: { type: Date, default: null },

}, { timestamps: true });

// Auto-derive status from call outcomes
// Rule: if c1.outcome === c2.outcome (both same) → no further call needed → auto-decide
leadSchema.pre('save', function(next) {
  const c1out = this.c1?.outcome || '';
  const c2out = this.c2Enabled ? (this.c2?.outcome || '') : '';
  const c3out = this.c3Enabled ? (this.c3?.outcome || '') : '';

  // If c1 and c2 are identical and both filled → auto status (no c3 needed)
  if (c1out && c2out && c1out === c2out) {
    this.status = (c1out === 'I') ? 'converted' : (c1out === 'NI' ? 'not_converted' : 'in_progress');
    return next();
  }

  // C3 done → final decision
  if (this.c3Enabled && c3out) {
    this.status = c3out === 'I' ? 'converted' : (c3out === 'NI' ? 'not_converted' : 'in_progress');
    return next();
  }

  // C1 done → in_progress
  if (c1out) { this.status = 'in_progress'; return next(); }

  this.status = 'pending';
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
