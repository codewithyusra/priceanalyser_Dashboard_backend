const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  config: {
    autoExecuteThreshold: { type: Number, default: 0.9 }, // Recommendations > 90% auto-execute
    marginFloor: { type: Number, default: 0.1 }, // 10% minimum margin
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Organization', OrganizationSchema);
