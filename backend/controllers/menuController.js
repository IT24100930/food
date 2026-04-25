const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenuItems = asyncHandler(async (req, res) => {
  const { category, available, search, page = 1, limit = 20 } = req.query;
  const query = { isDeleted: false };
  if (category)  query.category  = category;
  if (available) query.isAvailable = available === 'true';
  if (search)    query.name = { $regex: search, $options: 'i' };

  const skip  = (page - 1) * limit;
  const items = await MenuItem.find(query)
    .populate('ingredients.inventoryItem', 'name currentStock unit')
    .sort('-createdAt').skip(skip).limit(Number(limit));
  const total = await MenuItem.countDocuments(query);

  res.json({ success: true, count: items.length, total,
    pages: Math.ceil(total / limit), items });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id)
    .populate('ingredients.inventoryItem', 'name currentStock unit isLowStock');
  if (!item || item.isDeleted) throw new AppError('Menu item not found', 404);
  res.json({ success: true, item });
});

// @desc    Create menu item
// @route   POST /api/menu
// @access  Admin, Staff
const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, availableFrom, availableTo, availableDays, ingredients } = req.body;

  const item = await MenuItem.create({
    name, description, category, price: Number(price),
    availableFrom, availableTo,
    availableDays: availableDays ? JSON.parse(availableDays) : [],
    ingredients:   ingredients  ? JSON.parse(ingredients)   : [],
    image:         req.file ? req.file.path : '',
    imagePublicId: req.file ? req.file.filename : '',
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, message: 'Menu item created', item });
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Admin, Staff
const updateMenuItem = asyncHandler(async (req, res) => {
  let item = await MenuItem.findById(req.params.id);
  if (!item || item.isDeleted) throw new AppError('Menu item not found', 404);

  const updateData = { ...req.body };
  if (req.body.availableDays) updateData.availableDays = JSON.parse(req.body.availableDays);
  if (req.body.ingredients)   updateData.ingredients   = JSON.parse(req.body.ingredients);
  if (req.body.price)         updateData.price         = Number(req.body.price);

  // Replace image on Cloudinary
  if (req.file) {
    if (item.imagePublicId) {
      await cloudinary.uploader.destroy(item.imagePublicId).catch(() => {});
    }
    updateData.image         = req.file.path;
    updateData.imagePublicId = req.file.filename;
  }

  item = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  res.json({ success: true, message: 'Menu item updated', item });
});

// @desc    Delete menu item (soft delete)
// @route   DELETE /api/menu/:id
// @access  Admin
const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);
  item.isDeleted = true;
  await item.save();
  res.json({ success: true, message: 'Menu item removed' });
});

// @desc    Toggle availability
// @route   PATCH /api/menu/:id/availability
// @access  Admin, Staff
const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);
  item.isAvailable = !item.isAvailable;
  await item.save();
  res.json({ success: true, message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}`, item });
});

// @desc    Get menu analytics
// @route   GET /api/menu/analytics
// @access  Admin, Staff
const getMenuAnalytics = asyncHandler(async (req, res) => {
  const topSelling  = await MenuItem.find({ isDeleted: false }).sort('-totalOrdered').limit(5).select('name totalOrdered totalRevenue category image');
  const trending    = await MenuItem.find({ isDeleted: false }).sort('-weeklyOrdered').limit(5).select('name weeklyOrdered category image');
  const leastOrdered = await MenuItem.find({ isDeleted: false, totalOrdered: { $gt: 0 } }).sort('totalOrdered').limit(5).select('name totalOrdered category');

  const categoryStats = await MenuItem.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 }, totalRevenue: { $sum: '$totalRevenue' }, totalOrdered: { $sum: '$totalOrdered' } } }
  ]);

  res.json({ success: true, analytics: { topSelling, trending, leastOrdered, categoryStats } });
});

module.exports = { getMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, getMenuAnalytics };
