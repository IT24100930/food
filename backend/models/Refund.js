const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  payment:     { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order',   required: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  refundType:   { type: String, enum: ['Full', 'Partial'], required: true },
  amount:       { type: Number, required: true, min: 0 },
  reason:       { type: String, required: true, trim: true },
  description:  { type: String, trim: true },

  status:       { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Processed'], default: 'Pending' },

  refundMethod: { type: String, enum: ['Original Method', 'Cash', 'Credit'], default: 'Original Method' },
  refundNumber: { type: String, unique: true },

  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate refund number
refundSchema.pre('save', async function (next) {
  if (!this.refundNumber) {
    const count = await mongoose.model('Refund').countDocuments();
    this.refundNumber = `REF-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Refund', refundSchema);
