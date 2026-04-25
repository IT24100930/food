const crypto = require('crypto');
const User   = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', 400);

  // Only Admin can create Staff accounts
  const assignedRole = (role === 'Staff' || role === 'Admin') ? 'Customer' : (role || 'Customer');

  const user = await User.create({ name, email, password, phone, role: assignedRole });

  // Send verification email
  try {
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const tmpl = emailTemplates.verifyEmail(user.name, verifyUrl);
    await sendEmail({ to: user.email, ...tmpl });
  } catch (err) {
    console.log('Email send failed:', err.message);
  }

  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    message: 'Registration successful! Please verify your email.',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, trustScore: user.trustScore }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new AppError('Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) throw new AppError('Account has been deactivated. Contact support.', 401);

  user.lastLogin = Date.now();
  user.updateTrustScore(1, 'Successful login');
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id, name: user.name, email: user.email,
      role: user.role, trustScore: user.trustScore,
      isEmailVerified: user.isEmailVerified, avatar: user.avatar
    }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) throw new AppError('Invalid or expired verification link', 400);

  user.isEmailVerified = true;
  user.emailVerificationToken  = undefined;
  user.emailVerificationExpires = undefined;
  user.updateTrustScore(10, 'Email verified');
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully! ✅' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError('No user with that email address', 404);

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const tmpl = emailTemplates.resetPassword(user.name, resetUrl);

  try {
    await sendEmail({ to: user.email, ...tmpl });
    res.json({ success: true, message: 'Password reset link sent to your email!' });
  } catch (err) {
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Email could not be sent. Try again later.', 500);
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password           = req.body.password;
  user.passwordResetToken  = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, message: 'Password reset successful!', token });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully!' });
});

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, getMe, changePassword };
