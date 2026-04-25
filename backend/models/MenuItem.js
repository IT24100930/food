const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Item name is required'], trim: true, maxlength: 100
  },
  description: { type: String, trim: true, maxlength: 500 },
  category: {
    type: String,
    enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish', 'Special'],
    required: true
  },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  imagePublicId: { type: String }, // Cloudinary public_id for deletion

  // Availability Scheduling
  isAvailable: { type: Boolean, default: true },
  availableFrom: String, // e.g., "08:00"
  availableTo:   String, // e.g., "22:00"
  availableDays: [{
    type: String,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  }],

  // Ingredients (links to Inventory)
  ingredients: [{
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantityRequired: { type: Number, required: true }
  }],

  // Analytics
  totalOrdered:  { type: Number, default: 0 },
  totalRevenue:  { type: Number, default: 0 },
  weeklyOrdered: { type: Number, default: 0 },

  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual for trending (ordered this week)
menuItemSchema.virtual('isTrending').get(function () {
  return this.weeklyOrdered >= 10;
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
