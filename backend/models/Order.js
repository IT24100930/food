const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  subtotal:  { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],

  // Pricing
  subtotal:      { type: Number, required: true },
  taxAmount:     { type: Number, default: 0 },
  discountAmount:{ type: Number, default: 0 },
  tipAmount:     { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },

  // Applied codes
  appliedTax:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },
  appliedDiscount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
  discountCode:    String,

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  statusHistory: [{
    status:    String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note:      String,
  }],

  orderType: { type: String, enum: ['Dine-in', 'Takeaway', 'Delivery'], default: 'Dine-in' },
  tableNumber: String,
  deliveryAddress: String,
  specialInstructions: String,

  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded', 'Partial Refund'], default: 'Pending' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  cancelReason: String,
  cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
