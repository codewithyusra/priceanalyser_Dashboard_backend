const BaseAgent = require('./BaseAgent');

class InventoryAgent extends BaseAgent {
  constructor() {
    super('Inventory & Cost Agent', 'expert in stock management and margin protection');
  }

  formatPrompt(input) {
    const { product } = input;
    return `
      Check inventory constraints for SKU: ${product.sku}.
      Current Stock Level: ${product.stockLevel}
      COGS: ${product.cogs}
      Current Price: ${product.currentPrice}
      Current Margin: ${((product.currentPrice - product.cogs) / product.currentPrice * 100).toFixed(2)}%
      
      Determine if we have overstock (needs markdown) or low stock (protect margin).
      Output format: JSON with "inventoryStatus" (overstock/low/healthy) and "marginAdvice".
    `;
  }

  // Inherits parseResponse from BaseAgent
}

module.exports = InventoryAgent;
