const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

  // Amounts
  amountLKR:       { type: Number, required: true }, // Base currency
  amountPaid:      { type: Number, required: true }, // In selected currency
  currency:        { type: String, default: 'LKR' },
  exchangeRate:    { type: Number, default: 1 },

  // Breakdown
  subtotal:        Number,
  taxAmount:       Number,
  discountAmount:  Number,
  tipAmount:       Number,

  // Method
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'QR Code'],
    required: true
  },
  transactionId: { type: String, unique: true, sparse: true },

  // Invoice
  invoiceNumber: { type: String, unique: true },
  invoicePdfUrl: String,
  qrCodeUrl:     String,
  invoiceSentAt: Date,

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partial Refund'],
    default: 'Pending'
  },

  refundAmount: { type: Number, default: 0 },
  refunds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Refund' }],

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate invoice number
paymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const date  = new Date().toISOString().slice(0, 7).replace('-', '');
    this.invoiceNumber = `INV-${date}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
