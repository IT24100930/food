const Inventory = require('../models/Inventory');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Admin, Staff
const getInventory = asyncHandler(async (req, res) => {
  const { category, lowStock, expiringSoon, search, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };
  if (category)      query.category       = category;
  if (lowStock === 'true')      query.isLowStock     = true;
  if (expiringSoon === 'true')  query.isExpiringSoon = true;
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip  = (page - 1) * limit;
  const items = await Inventory.find(query).sort('name').skip(skip).limit(Number(limit));
  const total = await Inventory.countDocuments(query);

  const alertCounts = {
    lowStock:     await Inventory.countDocuments({ isActive: true, isLowStock: true }),
    expiringSoon: await Inventory.countDocuments({ isActive: true, isExpiringSoon: true }),
  };

  res.json({ success: true, count: items.length, total, pages: Math.ceil(total/limit), items, alertCounts });
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Admin, Staff
const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new AppError('Inventory item not found', 404);
  res.json({ success: true, item });
});

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Admin
const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, message: 'Inventory item created', item });
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Admin, Staff
const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw new AppError('Inventory item not found', 404);
  res.json({ success: true, message: 'Inventory item updated', item });
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Admin
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new AppError('Inventory item not found', 404);
  item.isActive = false;
  await item.save();
  res.json({ success: true, message: 'Inventory item removed' });
});

// @desc    Adjust stock (add/reduce)
// @route   PATCH /api/inventory/:id/stock
// @access  Admin, Staff
const adjustStock = asyncHandler(async (req, res) => {
  const { type, quantity, reason } = req.body;
  if (!['Add', 'Reduce', 'Adjustment'].includes(type)) throw new AppError('Invalid adjustment type', 400);
  if (!quantity || quantity <= 0) throw new AppError('Quantity must be positive', 400);

  const item = await Inventory.findById(req.params.id);
  if (!item) throw new AppError('Inventory item not found', 404);

  if (type === 'Reduce' && item.currentStock < quantity) {
    throw new AppError(`Insufficient stock. Current: ${item.currentStock} ${item.unit}`, 400);
  }

  if (type === 'Add')        item.currentStock += quantity;
  else if (type === 'Reduce') item.currentStock -= quantity;
  else                        item.currentStock  = quantity; // Adjustment = set absolute

  item.stockHistory.push({ type, quantity, reason: reason || 'Manual adjustment', updatedBy: req.user.id });
  await item.save();

  res.json({ success: true, message: 'Stock adjusted', item });
});

// @desc    Get stock history
// @route   GET /api/inventory/:id/history
// @access  Admin, Staff
const getStockHistory = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id)
    .populate('stockHistory.updatedBy', 'name role');
  if (!item) throw new AppError('Inventory item not found', 404);
  const history = item.stockHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ success: true, item: { name: item.name, unit: item.unit, currentStock: item.currentStock }, history });
});

// @desc    Get inventory alerts (low stock + expiring)
// @route   GET /api/inventory/alerts
// @access  Admin, Staff
const getInventoryAlerts = asyncHandler(async (req, res) => {
  const lowStock     = await Inventory.find({ isActive: true, isLowStock: true }).select('name currentStock minimumStock unit category');
  const expiringSoon = await Inventory.find({ isActive: true, isExpiringSoon: true, hasExpiry: true }).select('name currentStock unit expiryDate category');

  res.json({ success: true, alerts: { lowStock, expiringSoon, totalAlerts: lowStock.length + expiringSoon.length } });
});

module.exports = { getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock, getStockHistory, getInventoryAlerts };
