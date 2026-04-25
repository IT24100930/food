const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'], trim: true, maxlength: 50
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 6, select: false
  },
  role: {
    type: String, enum: ['Admin', 'Staff', 'Customer'],
    default: 'Customer'
  },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Trust Score System (0-100)
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  trustHistory: [{
    action: String,
    change:    Number,
    reason:    String,
    timestamp: { type: Date, default: Date.now }
  }],

  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Update trust score
userSchema.methods.updateTrustScore = function (change, reason) {
  this.trustScore = Math.max(0, Math.min(100, this.trustScore + change));
  this.trustHistory.push({ action: change > 0 ? 'increase' : 'decrease', change, reason });
};

module.exports = mongoose.model('User', userSchema);
