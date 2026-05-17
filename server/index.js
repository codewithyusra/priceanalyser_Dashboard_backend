const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const keepAwake = require('./services/keepAwake');


const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS must be before Rate Limiter
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased to allow dashboard polling (5 endpoints every 15s)
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);
app.use(express.json());


// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/pricing', require('./routes/pricing'));

app.get('/', (req, res) => {
  res.json({ message: 'AI Pricing Engine API' });
});

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricing-engine')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Initialize keep-awake for Render deployment
      const renderUrl = process.env.RENDER_EXTERNAL_URL;
      keepAwake(renderUrl);
    });

  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
