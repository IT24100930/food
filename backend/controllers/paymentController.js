const Payment  = require('../models/Payment');
const Order    = require('../models/Order');
const User     = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { generateInvoicePDF }    = require('../utils/pdfGenerator');
const { sendEmail, emailTemplates } = require('../utils/email');
const axios    = require('axios');
const QRCode   = require('qrcode');
const path     = require('path');
const fs       = require('fs');

// Supported currencies
const SUPPORTED_CURRENCIES = ['LKR','USD','EUR','GBP','AUD','CAD','SGD','JPY','INR','AED','SAR'];

// @desc    Get live exchange rates
// @route   GET /api/payments/exchange-rates
// @access  Private
const getExchangeRates = asyncHandler(async (req, res) => {
  try {
    // Free API - exchangerate-api.com
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/LKR`
    );
    const rates = {};
    SUPPORTED_CURRENCIES.forEach(c => {
      if (response.data.conversion_rates[c]) {
        rates[c] = parseFloat((response.data.conversion_rates[c]).toFixed(6));
      }
    });
    res.json({ success: true, base: 'LKR', rates, currencies: SUPPORTED_CURRENCIES });
  } catch {
    // Fallback static rates
    const fallback = { LKR:1,USD:0.0031,EUR:0.0029,GBP:0.0025,AUD:0.0047,CAD:0.0042,SGD:0.0042,JPY:0.46,INR:0.26,AED:0.011,SAR:0.012 };
    res.json({ success: true, base: 'LKR', rates: fallback, currencies: SUPPORTED_CURRENCIES, isFallback: true });
  }
});

// @desc    Process payment
// @route   POST /api/payments
// @access  Admin, Staff, Customer
const processPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, currency = 'LKR', exchangeRate = 1, tipAmount = 0 } = req.body;

  const order = await Order.findById(orderId).populate('customer appliedTax appliedDiscount');
  if (!order) throw new AppError('Order not found', 404);
  if (order.paymentStatus === 'Paid') throw new AppError('Order already paid', 400);

  const amountLKR  = parseFloat((order.totalAmount + tipAmount).toFixed(2));
  const amountPaid = parseFloat((amountLKR * exchangeRate).toFixed(2));

  // Generate QR code for verification
  const qrData    = JSON.stringify({ orderId, amountLKR, currency, timestamp: Date.now() });
  const qrDir     = path.join(__dirname, '../uploads/qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
  const qrFileName = `qr_${orderId}_${Date.now()}.png`;
  const qrFilePath = path.join(qrDir, qrFileName);
  await QRCode.toFile(qrFilePath, qrData, { width: 200 });

  const payment = await Payment.create({
    order:    order._id,
    customer: order.customer._id,
    amountLKR, amountPaid, currency, exchangeRate,
    subtotal:       order.subtotal,
    taxAmount:      order.taxAmount,
    discountAmount: order.discountAmount,
    tipAmount:      parseFloat(tipAmount),
    paymentMethod,
    qrCodeUrl:     `/uploads/qrcodes/${qrFileName}`,
    status:        'Completed',
    processedBy:   req.user.id,
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2,9).toUpperCase()}`
  });

  // Update order payment status
  order.paymentStatus = 'Paid';
  order.payment = payment._id;
  if (order.status === 'Pending') { order.status = 'Confirmed'; }
  await order.save();

  // Generate PDF invoice
  try {
    const customer = await User.findById(order.customer._id);
    const { filePath, fileName } = await generateInvoicePDF(payment, order, customer);
    payment.invoicePdfUrl = `/uploads/invoices/${fileName}`;
    payment.invoiceSentAt = new Date();
    await payment.save();

    // Send invoice email
    await sendEmail({
      to: customer.email,
      ...emailTemplates.invoice(
        customer.name, payment.invoiceNumber,
        order.items, amountPaid, currency,
        `${process.env.FRONTEND_URL || 'http://localhost:5000'}${payment.invoicePdfUrl}`
      )
    });

    // Update trust score
    customer.updateTrustScore(3, 'Payment completed');
    await customer.save({ validateBeforeSave: false });
  } catch (err) {
    console.log('Invoice generation error:', err.message);
  }

  const populated = await Payment.findById(payment._id)
    .populate('order', 'orderNumber items totalAmount status')
    .populate('customer', 'name email');

  res.status(201).json({ success: true, message: 'Payment processed successfully!', payment: populated });
});

// @desc    Get all payments
// @route   GET /api/payments
// @access  Admin, Staff
const getPayments = asyncHandler(async (req, res) => {
  const { status, currency, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status)   query.status   = status;
  if (currency) query.currency = currency;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(new Date(dateTo).setHours(23,59,59));
  }

  const skip     = (page - 1) * limit;
  const payments = await Payment.find(query)
    .populate('order', 'orderNumber status orderType')
    .populate('customer', 'name email')
    .sort('-createdAt').skip(skip).limit(Number(limit));
  const total = await Payment.countDocuments(query);

  res.json({ success: true, count: payments.length, total, pages: Math.ceil(total/limit), payments });
});

// @desc    Get single payment / invoice
// @route   GET /api/payments/:id
// @access  Private
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order')
    .populate('customer', 'name email phone')
    .populate('refunds');
  if (!payment) throw new AppError('Payment not found', 404);
  res.json({ success: true, payment });
});

// @desc    Revenue analytics
// @route   GET /api/payments/analytics
// @access  Admin
const getPaymentAnalytics = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayRevenue, monthRevenue, totalRevenue, byCurrency, byMethod] = await Promise.all([
    Payment.aggregate([{ $match: { status:'Completed', createdAt:{ $gte: today } } }, { $group:{ _id:null, total:{ $sum:'$amountLKR' }, count:{ $sum:1 } } }]),
    Payment.aggregate([{ $match: { status:'Completed', createdAt:{ $gte: thisMonth } } }, { $group:{ _id:null, total:{ $sum:'$amountLKR' }, count:{ $sum:1 } } }]),
    Payment.aggregate([{ $match: { status:'Completed' } }, { $group:{ _id:null, total:{ $sum:'$amountLKR' }, count:{ $sum:1 } } }]),
    Payment.aggregate([{ $match:{ status:'Completed' } }, { $group:{ _id:'$currency', total:{ $sum:'$amountPaid' }, count:{ $sum:1 } } }]),
    Payment.aggregate([{ $match:{ status:'Completed' } }, { $group:{ _id:'$paymentMethod', total:{ $sum:'$amountLKR' }, count:{ $sum:1 } } }])
  ]);

  res.json({ success: true, analytics: {
    today:   todayRevenue[0]  || { total: 0, count: 0 },
    month:   monthRevenue[0]  || { total: 0, count: 0 },
    total:   totalRevenue[0]  || { total: 0, count: 0 },
    byCurrency, byMethod
  }});
});

module.exports = { getExchangeRates, processPayment, getPayments, getPayment, getPaymentAnalytics };
