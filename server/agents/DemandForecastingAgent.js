const BaseAgent = require('./BaseAgent');

class DemandForecastingAgent extends BaseAgent {
  constructor() {
    super('Demand Forecasting Agent', 'expert in consumer demand and seasonal trends');
  }

  formatPrompt(input) {
    const { product, trends } = input;
    return `
      Analyze demand for SKU: ${product.sku} in category: ${product.category}.
      Current Sales Velocity: ${trends.velocity}
      Market Search Trends: ${trends.searchTrend}
      Seasonality: ${trends.seasonality}
      
      Predict if demand will increase or decrease. 
      Output format: JSON with "forecast" (increase/decrease/stable) and "rationale".
    `;
  }

  // Inherits parseResponse from BaseAgent
}

module.exports = DemandForecastingAgent;
