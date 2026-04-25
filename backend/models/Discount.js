const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:        { type: String, enum: ['Percentage', 'Fixed'], required: true },
  value:       { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },

  // Limits
  minimumOrderAmount: { type: Number, default: 0 },
  maximumDiscount:    { type: Number }, // Cap for percentage discounts
  usageLimit:         { type: Number, default: null }, // null = unlimited
  usedCount:          { type: Number, default: 0 },
  perUserLimit:       { type: Number, default: 1 },

  // Validity
  startDate:   { type: Date, default: Date.now },
  expiryDate:  { type: Date, required: true },

  isActive:    { type: Boolean, default: true },
  appliesTo:   [{ type: String, enum: ['Dine-in', 'Takeaway', 'Delivery'] }],

  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Check if discount is valid
discountSchema.methods.isValid = function (orderAmount, userId, orderType) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Discount is inactive' };
  if (now > this.expiryDate) return { valid: false, reason: 'Discount has expired' };
  if (now < this.startDate) return { valid: false, reason: 'Discount not yet active' };
  if (orderAmount < this.minimumOrderAmount)
    return { valid: false, reason: `Minimum order amount is ${this.minimumOrderAmount}` };
  if (this.usageLimit && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'Discount usage limit reached' };
  const userUsageCount = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUsageCount >= this.perUserLimit)
    return { valid: false, reason: 'You have already used this discount' };
  return { valid: true };
};

// Calculate discount amount
discountSchema.methods.calculateDiscount = function (orderAmount) {
  let amount = 0;
  if (this.type === 'Percentage') {
    amount = (orderAmount * this.value) / 100;
    if (this.maximumDiscount) amount = Math.min(amount, this.maximumDiscount);
  } else {
    amount = Math.min(this.value, orderAmount);
  }
  return parseFloat(amount.toFixed(2));
};

module.exports = mongoose.model('Discount', discountSchema);
