const Product = require('../models/Product');
const Recommendation = require('../models/Recommendation');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const MarketIntelligenceAgent = require('../agents/MarketIntelligenceAgent');
const DemandForecastingAgent = require('../agents/DemandForecastingAgent');
const InventoryAgent = require('../agents/InventoryAgent');
const PricingStrategyAgent = require('../agents/PricingStrategyAgent');
const ExecutionAgent = require('../agents/ExecutionAgent');

const marketAgent = new MarketIntelligenceAgent();
const demandAgent = new DemandForecastingAgent();
const inventoryAgent = new InventoryAgent();
const strategyAgent = new PricingStrategyAgent();
const executionAgent = new ExecutionAgent();

const generateDynamicCompetitors = (product) => {
  const marketplaces = [
    'Amazon Global', 
    'eBay Premium', 
    'Walmart Direct', 
    'Target Online', 
    'BestBuy Elite', 
    'B&H Photo', 
    'Newegg Official',
    'Rakuten',
    'AliExpress'
  ];
  
  // Dynamic number of competitors (2 to 6)
  const numCompetitors = Math.floor(Math.random() * 5) + 2; 
  
  return marketplaces
    .sort(() => 0.5 - Math.random())
    .slice(0, numCompetitors)
    .map(name => {
      // Dynamic pricing factor between 82% and 118% of current price
      const factor = 0.82 + Math.random() * 0.36;
      return {
        name: name,
        price: parseFloat((product.currentPrice * factor).toFixed(2))
      };
    });
};

exports.generateRecommendation = async (req, res) => {
  const { productId } = req.params;
  const orgId = req.user.orgId;

  try {
    const product = await Product.findOne({ _id: productId, organizationId: orgId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const organization = await Organization.findById(orgId);

    // 1. Dynamic Market Intelligence Integration
    const mockCompetitors = generateDynamicCompetitors(product);
    
    const trendsOptions = [
      { velocity: 'High', searchTrend: 'Rising', seasonality: 'Spring Peak' },
      { velocity: 'Moderate', searchTrend: 'Stable', seasonality: 'Mid-Season' },
      { velocity: 'Low', searchTrend: 'Falling', seasonality: 'Clearance' },
      { velocity: 'Extreme', searchTrend: 'Viral', seasonality: 'Holiday Peak' }
    ];
    const mockTrends = trendsOptions[Math.floor(Math.random() * trendsOptions.length)];

    // 2. Run Agents in Parallel (Specialists)
    const [marketData, demandData, inventoryData] = await Promise.all([
      marketAgent.process({ product, competitors: mockCompetitors }),
      demandAgent.process({ product, trends: mockTrends }),
      inventoryAgent.process({ product }),
    ]);

    // 3. Synthesize with Strategy Agent
    const strategyOutput = await strategyAgent.process({
      product,
      marketData,
      demandData,
      inventoryData,
    });

    // 4. Validate with Execution Agent
    const compliance = await executionAgent.validate(strategyOutput, organization.config);

    // 5. Save Recommendation
    const recommendation = new Recommendation({
      productId: product._id,
      organizationId: orgId,
      proposedPrice: strategyOutput.proposedPrice,
      currentPrice: product.currentPrice,
      confidenceScore: strategyOutput.confidenceScore,
      rationale: strategyOutput.rationale,
      lowestCompetitorPrice: strategyOutput.lowestCompetitorPrice,
      lowestCompetitorName: strategyOutput.lowestCompetitorName,
      agentContributions: {
        marketIntelligence: { 
          ...marketData, 
          competitors: mockCompetitors 
        },
        demandForecasting: demandData,
        inventory: inventoryData,
      },
      status: compliance.action === 'AUTO_EXECUTE' ? 'auto-executed' : 'pending',
    });

    await recommendation.save();

    // 6. Handle Auto-Execution
    if (compliance.action === 'AUTO_EXECUTE') {
      const oldPrice = product.currentPrice;
      product.currentPrice = strategyOutput.proposedPrice;
      product.status = 'auto-executed';
      await product.save();

      const log = new AuditLog({
        productId: product._id,
        organizationId: orgId,
        previousPrice: oldPrice,
        newPrice: strategyOutput.proposedPrice,
        changedBy: 'AI Agent',
        recommendationId: recommendation._id,
      });
      await log.save();
    }

    res.json(recommendation);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during AI generation');
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ organizationId: req.user.orgId })
      .populate('productId')
      .sort({ status: -1, confidenceScore: -1 }); // Prioritize pending/auto-executed and high confidence
    res.json(recommendations);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.updateRecommendationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body; // status: approved, rejected

  try {
    const recommendation = await Recommendation.findOne({ _id: id, organizationId: req.user.orgId });
    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });

    recommendation.status = status;
    await recommendation.save();

    if (status === 'approved') {
      const { manualPrice } = req.body;
      const finalPrice = manualPrice ? parseFloat(manualPrice) : recommendation.proposedPrice;
      
      const product = await Product.findById(recommendation.productId);
      const oldPrice = product.currentPrice;
      product.currentPrice = finalPrice;
      product.status = 'approved';
      await product.save();

      // If manual price was used, update the recommendation record to reflect what was actually executed
      if (manualPrice) {
        recommendation.actualExecutedPrice = finalPrice;
        await recommendation.save();
      }

      const log = new AuditLog({
        productId: product._id,
        organizationId: req.user.orgId,
        previousPrice: oldPrice,
        newPrice: finalPrice,
        changedBy: req.user.userId,
        recommendationId: recommendation._id,
        isManualOverride: !!manualPrice
      });
      await log.save();
    }

    res.json(recommendation);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ organizationId: req.user.orgId })
      .populate('productId', 'name sku')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.recheckAll = async (req, res) => {
  const orgId = req.user.orgId;
  try {
    const products = await Product.find({ organizationId: orgId });
    
    // Trigger analysis for each product in the background
    // We don't want to wait for all LLM calls to finish to respond to the user
    // because it might take a long time. We'll return a status.
    
    // In a production app, this would be a background job (BullMQ/Redis)
    // For this assignment, we'll run them in parallel and log progress
    const analysisPromises = products.map(product => 
      this.generateRecommendation({ 
        params: { productId: product._id }, 
        user: req.user 
      }, { 
        json: (data) => console.log(`Processed ${product.sku}`),
        status: () => ({ json: () => {} }),
        send: () => {}
      })
    );

    res.json({ message: `Initiated bulk market check for ${products.length} products.` });
  } catch (err) {
    res.status(500).send('Server error during bulk check');
  }
};

exports.getTrends = async (req, res) => {
  try {
    const products = await Product.find({ organizationId: req.user.orgId });
    const logs = await AuditLog.find({ organizationId: req.user.orgId }).sort({ timestamp: 1 });

    // Generate last 7 days trends
    const trends = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      // Calculate projected revenue and margin for this day based on products
      // In a real app, this would query historical snapshots
      let dailyRevenue = 0;
      let dailyMargin = 0;

      products.forEach(p => {
        dailyRevenue += p.currentPrice * (p.stockLevel / 50); // Weighted mock
        dailyMargin += (p.currentPrice - p.cogs) * (p.stockLevel / 50);
      });

      // Add some variance based on logs from that day
      const dailyLogs = logs.filter(l => new Date(l.timestamp).toDateString() === date.toDateString());
      const variance = dailyLogs.length * 150;

      trends.push({
        name: dayName,
        revenue: Math.floor(dailyRevenue + variance),
        margin: Math.floor((dailyMargin / dailyRevenue) * 100) || 24,
      });
    }

    res.json(trends);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.exportRecommendationsCSV = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ organizationId: req.user.orgId })
      .populate('productId', 'name sku currentPrice');
    
    let csv = 'Product Name,SKU,Current Price,Proposed Price,Confidence Score,Status,Rationale\n';
    
    recommendations.forEach(rec => {
      const productName = rec.productId ? rec.productId.name : 'N/A';
      const sku = rec.productId ? rec.productId.sku : 'N/A';
      const currentPrice = rec.productId ? rec.productId.currentPrice : rec.currentPrice;
      const rationale = rec.rationale ? rec.rationale.replace(/,/g, ';').replace(/\n/g, ' ') : '';
      
      csv += `"${productName}","${sku}",${currentPrice},${rec.proposedPrice},${rec.confidenceScore},"${rec.status}","${rationale}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('pricing-recommendations.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).send('Error generating export');
  }
};
