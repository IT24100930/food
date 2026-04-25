const Order     = require('../models/Order');
const MenuItem  = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const Tax       = require('../models/Tax');
const Discount  = require('../models/Discount');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Create order
// @route   POST /api/orders
// @access  Customer, Staff
const createOrder = asyncHandler(async (req, res) => {
  const { items, orderType, tableNumber, deliveryAddress, specialInstructions, discountCode, tipAmount } = req.body;

  if (!items || !items.length) throw new AppError('Order must have at least one item', 400);

  // Build order items & validate menu items
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem);
    if (!menuItem || !menuItem.isAvailable || menuItem.isDeleted) {
      throw new AppError(`Item "${item.menuItem}" is not available`, 400);
    }
    const itemSubtotal = menuItem.price * item.quantity;
    subtotal += itemSubtotal;
    orderItems.push({
      menuItem: menuItem._id,
      name:     menuItem.name,
      price:    menuItem.price,
      quantity: item.quantity,
      subtotal: itemSubtotal
    });
  }

  // Apply default tax
  const defaultTax = await Tax.findOne({ isDefault: true, isActive: true });
  let taxAmount = 0;
  let appliedTax;
  if (defaultTax) {
    taxAmount  = parseFloat(((subtotal * defaultTax.rate) / 100).toFixed(2));
    appliedTax = defaultTax._id;
  }

  // Apply discount
  let discountAmount = 0;
  let appliedDiscount;
  if (discountCode) {
    const discount = await Discount.findOne({ code: discountCode.toUpperCase() });
    if (!discount) throw new AppError('Invalid discount code', 400);
    const validity = discount.isValid(subtotal, req.user.id, orderType);
    if (!validity.valid) throw new AppError(validity.reason, 400);
    discountAmount   = discount.calculateDiscount(subtotal);
    appliedDiscount  = discount._id;
  }

  const tip   = tipAmount ? parseFloat(tipAmount) : 0;
  const total = parseFloat((subtotal + taxAmount - discountAmount + tip).toFixed(2));

  const order = await Order.create({
    customer: req.user.id,
    items:    orderItems,
    subtotal, taxAmount, discountAmount,
    tipAmount: tip, totalAmount: total,
    appliedTax, appliedDiscount, discountCode,
    orderType, tableNumber, deliveryAddress,
    specialInstructions,
    statusHistory: [{ status: 'Pending', updatedBy: req.user.id }]
  });

  // Update menu analytics
  for (const item of orderItems) {
    await MenuItem.findByIdAndUpdate(item.menuItem, {
      $inc: { totalOrdered: item.quantity, totalRevenue: item.subtotal, weeklyOrdered: item.quantity }
    });
  }

  // Update discount usage
  if (appliedDiscount) {
    await Discount.findByIdAndUpdate(appliedDiscount, {
      $inc: { usedCount: 1 }, $push: { usedBy: req.user.id }
    });
  }

  // Auto reduce inventory
  for (const orderItem of orderItems) {
    const menuItem = await MenuItem.findById(orderItem.menuItem).populate('ingredients.inventoryItem');
    for (const ing of menuItem.ingredients) {
      const qty = ing.quantityRequired * orderItem.quantity;
      const inv = await Inventory.findById(ing.inventoryItem);
      if (inv) {
        inv.currentStock = Math.max(0, inv.currentStock - qty);
        inv.stockHistory.push({ type: 'Reduce', quantity: qty, reason: `Order ${order.orderNumber}`, orderId: order._id, updatedBy: req.user.id });
        await inv.save();
      }
    }
  }

  const populated = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('appliedTax', 'name rate')
    .populate('appliedDiscount', 'name code');

  res.status(201).json({ success: true, message: 'Order placed successfully!', order: populated });
});

// @desc    Get all orders (with search & filter)
// @route   GET /api/orders
// @access  Admin, Staff
const getOrders = asyncHandler(async (req, res) => {
  const { status, search, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const query = {};

  if (status) query.status = status;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
  }

  // Search by order number
  if (search) {
    const customers = await require('../models/User').find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customer: { $in: customers.map(c => c._id) } }
    ];
  }

  const skip   = (page - 1) * limit;
  const orders = await Order.find(query)
    .populate('customer', 'name email phone')
    .sort(sort).skip(skip).limit(Number(limit));
  const total  = await Order.countDocuments(query);

  res.json({ success: true, count: orders.length, total,
    pages: Math.ceil(total / limit), currentPage: Number(page), orders });
});

// @desc    Get customer's orders
// @route   GET /api/orders/my-orders
// @access  Customer
const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { customer: req.user.id };
  if (status) query.status = status;

  const skip   = (page - 1) * limit;
  const orders = await Order.find(query)
    .sort('-createdAt').skip(skip).limit(Number(limit))
    .populate('appliedTax', 'name rate')
    .populate('appliedDiscount', 'name code value type');
  const total = await Order.countDocuments(query);

  res.json({ success: true, count: orders.length, total, orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('appliedTax')
    .populate('appliedDiscount')
    .populate('payment')
    .populate('statusHistory.updatedBy', 'name role');

  if (!order) throw new AppError('Order not found', 404);

  // Customers can only view their own orders
  if (req.user.role === 'Customer' && order.customer._id.toString() !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  res.json({ success: true, order });
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Admin, Staff
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  order.status = status;
  order.statusHistory.push({ status, updatedBy: req.user.id, note });

  if (status === 'Cancelled') {
    order.cancelReason  = note;
    order.cancelledBy   = req.user.id;
    // Decrease trust score if customer cancels
    if (req.user.role === 'Customer') {
      const user = await require('../models/User').findById(order.customer);
      if (user) { user.updateTrustScore(-5, 'Order cancelled'); await user.save({ validateBeforeSave: false }); }
    }
  }

  await order.save();
  res.json({ success: true, message: `Order status updated to ${status}`, order });
});

// @desc    Cancel order (Customer)
// @route   PATCH /api/orders/:id/cancel
// @access  Customer
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user.id) throw new AppError('Not authorized', 403);
  if (!['Pending', 'Confirmed'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  order.status       = 'Cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.cancelledBy  = req.user.id;
  order.statusHistory.push({ status: 'Cancelled', updatedBy: req.user.id, note: order.cancelReason });
  await order.save();

  res.json({ success: true, message: 'Order cancelled', order });
});

module.exports = { createOrder, getOrders, getMyOrders, getOrder, updateOrderStatus, cancelOrder };
