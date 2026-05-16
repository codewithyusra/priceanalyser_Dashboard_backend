const BaseAgent = require('./BaseAgent');

class MarketIntelligenceAgent extends BaseAgent {
  constructor() {
    super('Market Intelligence Agent', 'expert in competitor price analysis');
  }

  formatPrompt(input) {
    const { product, competitors } = input;
    return `
      Analyze the following market conditions for SKU: ${product.sku}.
      Current Price: ${product.currentPrice}
      
      Competitor Prices:
      ${competitors.map((c) => `- ${c.name}: ${c.price}`).join('\n')}
      
      Identify if there are any significant price drops or changes. 
      Summarize the competitive landscape in 2-3 sentences.
      Output format: JSON with "summary" and "alertLevel" (low/medium/high).
    `;
  }

  // Inherits parseResponse from BaseAgent
}

module.exports = MarketIntelligenceAgent;
