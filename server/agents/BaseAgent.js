const axios = require('axios');

class BaseAgent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  async process(input) {
    if (!this.apiKey) {
      console.error('Groq API Key missing');
      return { error: 'Groq API Key not configured' };
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are the ${this.role}. Respond strictly in the requested JSON format.`,
            },
            {
              role: 'user',
              content: this.formatPrompt(input),
            },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error(`Error in ${this.name}:`, error.response?.data || error.message);
      return { error: `Failed to process ${this.name}` };
    }
  }

  formatPrompt(input) {
    return `You are the ${this.role}. ${input}`;
  }

  parseResponse(response) {
    try {
      return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
      console.error('Failed to parse agent response:', e);
      return { error: 'Invalid JSON response from agent' };
    }
  }
}

module.exports = BaseAgent;
