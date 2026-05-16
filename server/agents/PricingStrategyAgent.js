const BaseAgent = require('./BaseAgent');

class PricingStrategyAgent extends BaseAgent {
  constructor() {
    super('Pricing Strategy Agent', 'the central pricing coordinator');
  }

  formatPrompt(input) {
    const { product, marketData, demandData, inventoryData } = input;
    return `
      You are the master Pricing Strategist. Finalize a price recommendation for SKU: ${product.sku}.
      
      INPUTS FROM SPECIALISTS:
      1. Market Intelligence: ${JSON.stringify(marketData)}
      2. Demand Forecast: ${JSON.stringify(demandData)}
      3. Inventory & Cost: ${JSON.stringify(inventoryData)}
      
      Business Rules:
      - Never drop below COGS: ${product.cogs}
      - Aim for optimal balance of volume and margin.
      
      Output a final recommendation. 
      In your "rationale", you MUST explicitly mention the lowest competitor price found and the name of that competitor (e.g., "The market floor is currently set by [Name] at $[Price]").
      REQUIRED JSON FORMAT:
      {
        "proposedPrice": number,
        "confidenceScore": number (0 to 1),
        "rationale": "detailed explanation of why this price was chosen",
        "strategyUsed": "e.g. Competitive Match, Markdown, Premium Protect",
        "lowestCompetitorPrice": number,
        "lowestCompetitorName": "name of the most aggressive competitor"
      }
    `;
  }

  // Inherits parseResponse from BaseAgent
}

module.exports = PricingStrategyAgent;
