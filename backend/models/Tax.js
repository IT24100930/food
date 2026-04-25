const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  rate:        { type: Number, required: true, min: 0, max: 100 }, // Percentage
  description: { type: String, trim: true },
  isActive:    { type: Boolean, default: true },
  isDefault:   { type: Boolean, default: false }, // Applied automatically
  appliesTo:   [{ type: String, enum: ['Dine-in', 'Takeaway', 'Delivery'] }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Tax', taxSchema);
