// ─── TAX CONTROLLER ──────────────────────────────────────────────────────────
const Tax      = require('../models/Tax');
const Discount = require('../models/Discount');
const Refund   = require('../models/Refund');
const Payment  = require('../models/Payment');
const Order    = require('../models/Order');
const User     = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');

// ── TAXES ─────────────────────────────────────────────────────────────────────
const getTaxes = asyncHandler(async (req, res) => {
  const taxes = await Tax.find().sort('-createdAt').populate('createdBy', 'name');
  res.json({ success: true, count: taxes.length, taxes });
});

const createTax = asyncHandler(async (req, res) => {
  const { name, rate, description, isDefault, appliesTo } = req.body;
  // Unset previous default if setting new default
  if (isDefault) await Tax.updateMany({}, { isDefault: false });
  const tax = await Tax.create({ name, rate, description, isDefault, appliesTo, createdBy: req.user.id });
  res.status(201).json({ success: true, message: 'Tax created', tax });
});

const updateTax = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await Tax.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
  const tax = await Tax.findByIdAndUpdate(req.params.id,
    { ...req.body, updatedBy: req.user.id }, { new: true, runValidators: true });
  if (!tax) throw new AppError('Tax not found', 404);
  res.json({ success: true, message: 'Tax updated', tax });
});

const deleteTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) throw new AppError('Tax not found', 404);
  await tax.deleteOne();
  res.json({ success: true, message: 'Tax deleted' });
});

const toggleTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) throw new AppError('Tax not found', 404);
  tax.isActive = !tax.isActive;
  await tax.save();
  res.json({ success: true, message: `Tax ${tax.isActive ? 'activated' : 'deactivated'}`, tax });
});

// ── DISCOUNTS ─────────────────────────────────────────────────────────────────
const getDiscounts = asyncHandler(async (req, res) => {
  const { active } = req.query;
  const query = {};
  if (active === 'true') {
    query.isActive = true;
    query.expiryDate = { $gte: new Date() };
  }
  const discounts = await Discount.find(query).sort('-createdAt').populate('createdBy', 'name');
  res.json({ success: true, count: discounts.length, discounts });
});

const createDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, message: 'Discount created', discount });
});

const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!discount) throw new AppError('Discount not found', 404);
  res.json({ success: true, message: 'Discount updated', discount });
});

const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) throw new AppError('Discount not found', 404);
  await discount.deleteOne();
  res.json({ success: true, message: 'Discount deleted' });
});

const validateDiscountCode = asyncHandler(async (req, res) => {
  const { code, orderAmount, orderType } = req.body;
  const discount = await Discount.findOne({ code: code.toUpperCase() });
  if (!discount) throw new AppError('Invalid discount code', 404);
  const validity = discount.isValid(Number(orderAmount), req.user.id, orderType);
  if (!validity.valid) throw new AppError(validity.reason, 400);
  const discountAmount = discount.calculateDiscount(Number(orderAmount));
  res.json({ success: true, discount: { name: discount.name, type: discount.type, value: discount.value, discountAmount } });
});

// ── REFUNDS ───────────────────────────────────────────────────────────────────
const getRefunds = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  const skip    = (page - 1) * limit;
  const refunds = await Refund.find(query)
    .populate('payment', 'invoiceNumber amountPaid currency')
    .populate('order', 'orderNumber')
    .populate('customer', 'name email')
    .populate('processedBy', 'name role')
    .sort('-createdAt').skip(skip).limit(Number(limit));
  const total = await Refund.countDocuments(query);
  res.json({ success: true, count: refunds.length, total, refunds });
});

const createRefund = asyncHandler(async (req, res) => {
  const { paymentId, refundType, amount, reason, description, refundMethod } = req.body;

  const payment = await Payment.findById(paymentId).populate('order').populate('customer');
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status === 'Refunded') throw new AppError('Payment already fully refunded', 400);

  const maxRefund = payment.amountLKR - (payment.refundAmount || 0);
  if (amount > maxRefund) throw new AppError(`Max refundable amount is LKR ${maxRefund}`, 400);

  const refund = await Refund.create({
    payment: payment._id, order: payment.order._id,
    customer: payment.customer._id, processedBy: req.user.id,
    refundType, amount, reason, description, refundMethod,
    status: 'Approved'
  });

  // Update payment
  payment.refundAmount = (payment.refundAmount || 0) + amount;
  payment.refunds.push(refund._id);
  payment.status = payment.refundAmount >= payment.amountLKR ? 'Refunded' : 'Partial Refund';
  await payment.save();

  // Update order payment status
  await Order.findByIdAndUpdate(payment.order._id, {
    paymentStatus: payment.status === 'Refunded' ? 'Refunded' : 'Partial Refund'
  });

  // Send email notification
  try {
    const customer = await User.findById(payment.customer._id);
    await sendEmail({
      to: customer.email,
      ...emailTemplates.refundProcessed(customer.name, refund.refundNumber, amount, 'LKR')
    });
    refund.notificationSent = true;
    await refund.save();
  } catch (e) { console.log('Refund email failed:', e.message); }

  const populated = await Refund.findById(refund._id)
    .populate('payment', 'invoiceNumber')
    .populate('order', 'orderNumber')
    .populate('customer', 'name email')
    .populate('processedBy', 'name');

  res.status(201).json({ success: true, message: 'Refund processed successfully!', refund: populated });
});

const updateRefundStatus = asyncHandler(async (req, res) => {
  const refund = await Refund.findByIdAndUpdate(req.params.id,
    { status: req.body.status }, { new: true });
  if (!refund) throw new AppError('Refund not found', 404);
  res.json({ success: true, message: 'Refund status updated', refund });
});

module.exports = {
  // Tax
  getTaxes, createTax, updateTax, deleteTax, toggleTax,
  // Discount
  getDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscountCode,
  // Refund
  getRefunds, createRefund, updateRefundStatus
};
