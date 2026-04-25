const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const query = {};
  if (role)   query.role = role;
  if (search) query.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];

  const skip  = (page - 1) * limit;
  const users = await User.find(query).sort(sort).skip(skip).limit(Number(limit));
  const total = await User.countDocuments(query);

  res.json({ success: true, count: users.length, total,
    pages: Math.ceil(total / limit), currentPage: Number(page), users });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});

// @desc    Update user role (Admin)
// @route   PUT /api/users/:id/role
// @access  Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['Admin', 'Staff', 'Customer'].includes(role)) throw new AppError('Invalid role', 400);

  const user = await User.findByIdAndUpdate(
    req.params.id, { role }, { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, message: 'Role updated', user });
});

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

// @desc    Get trust score analytics (Admin)
// @route   GET /api/users/trust-analytics
// @access  Admin
const getTrustAnalytics = asyncHandler(async (req, res) => {
  const analytics = await User.aggregate([
    { $match: { role: 'Customer' } },
    { $group: {
        _id: null,
        avgTrustScore:  { $avg: '$trustScore' },
        highTrust:      { $sum: { $cond: [{ $gte: ['$trustScore', 75] }, 1, 0] } },
        mediumTrust:    { $sum: { $cond: [{ $and: [{ $gte: ['$trustScore', 40] }, { $lt: ['$trustScore', 75] }] }, 1, 0] } },
        lowTrust:       { $sum: { $cond: [{ $lt: ['$trustScore', 40] }, 1, 0] } },
        totalCustomers: { $sum: 1 }
      }
    }
  ]);

  const topCustomers = await User.find({ role: 'Customer' })
    .sort('-trustScore').limit(10).select('name email trustScore createdAt');

  res.json({ success: true, analytics: analytics[0] || {}, topCustomers });
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const update = {};
  if (name)  update.name  = name;
  if (phone) update.phone = phone;
  if (req.file) update.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === req.user.id) throw new AppError('Cannot delete your own account', 400);
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getAllUsers, getUser, updateUserRole, toggleUserStatus, getTrustAnalytics, updateProfile, deleteUser };
