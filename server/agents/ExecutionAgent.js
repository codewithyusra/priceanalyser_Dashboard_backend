const BaseAgent = require('./BaseAgent');

class ExecutionAgent extends BaseAgent {
  constructor() {
    super('Execution & Compliance Agent', 'final compliance checker');
  }

  async validate(recommendation, organizationConfig) {
    const { proposedPrice, confidenceScore } = recommendation;
    const { autoExecuteThreshold, marginFloor } = organizationConfig;

    // Logic: If confidence > threshold and price > floor, it can auto-execute
    const canAutoExecute = confidenceScore >= autoExecuteThreshold;
    
    return {
      isValid: true, // Simplified validation
      action: canAutoExecute ? 'AUTO_EXECUTE' : 'REQUIRE_APPROVAL',
      reason: canAutoExecute ? 'Threshold met' : 'Manual review required',
    };
  }
}

module.exports = ExecutionAgent;
