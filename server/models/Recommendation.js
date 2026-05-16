const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  proposedPrice: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  confidenceScore: {
    type: Number,
    required: true,
  },
  rationale: {
    type: String,
    required: true,
  },
  lowestCompetitorPrice: {
    type: Number,
  },
  lowestCompetitorName: {
    type: String,
  },
  agentContributions: {
    marketIntelligence: mongoose.Schema.Types.Mixed,
    demandForecasting: mongoose.Schema.Types.Mixed,
    inventory: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-executed'],
    default: 'pending',
  },
  actualExecutedPrice: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
