const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  cogs: {
    type: Number,
    required: true,
  },
  stockLevel: {
    type: Number,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  lastCompetitorCheck: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-executed', 'stable'],
    default: 'stable',
  },
});

// Ensure SKU uniqueness per organization
ProductSchema.index({ sku: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);
