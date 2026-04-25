const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
  type:      { type: String, enum: ['Add', 'Reduce', 'Adjustment', 'Expired'], required: true },
  quantity:  { type: Number, required: true },
  reason:    String,
  orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 100 },
  category:     { type: String, enum: ['Ingredient', 'Beverage', 'Packaging', 'Other'], default: 'Ingredient' },
  unit:         { type: String, enum: ['kg', 'g', 'L', 'ml', 'pcs', 'dozen'], required: true },
  currentStock: { type: Number, required: true, min: 0, default: 0 },
  minimumStock: { type: Number, required: true, default: 10 }, // Low stock threshold
  maximumStock: { type: Number, default: 1000 },
  costPerUnit:  { type: Number, default: 0 },

  // Expiry Tracking
  expiryDate:   Date,
  hasExpiry:    { type: Boolean, default: false },

  // Alerts
  isLowStock:   { type: Boolean, default: false },
  isExpiringSoon: { type: Boolean, default: false }, // within 3 days

  // Stock History
  stockHistory: [stockHistorySchema],

  supplier: { type: String, trim: true },
  notes:    { type: String, trim: true },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-update isLowStock
inventorySchema.pre('save', function (next) {
  this.isLowStock = this.currentStock <= this.minimumStock;
  if (this.hasExpiry && this.expiryDate) {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    this.isExpiringSoon = (this.expiryDate - Date.now()) <= threeDays;
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
