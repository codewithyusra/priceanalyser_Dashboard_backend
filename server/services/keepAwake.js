const axios = require('axios');

/**
 * Pings the server periodically to prevent Render's free tier from sleeping.
 * @param {string} url - The public URL of your deployed backend.
 */
const keepAwake = (url) => {
  if (!url) {
    console.log('----------------------------------------------------');
    console.log('⚠️  KEEP-AWAKE: No RENDER_EXTERNAL_URL found in .env');
    console.log('Please add your Render URL to keep the server alive.');
    console.log('----------------------------------------------------');
    return;
  }

  // Ping every 10 minutes (600,000 ms)
  // Render's free tier sleeps after 15 minutes of inactivity.
  setInterval(async () => {
    try {
      const response = await axios.get(url);
      console.log(`[Keep-Awake] Pinged ${url} - Status: ${response.status} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`[Keep-Awake] Error pinging ${url}:`, error.message);
    }
  }, 600000); 

  console.log(`🚀 Keep-awake service initialized for: ${url}`);
};

module.exports = keepAwake;
