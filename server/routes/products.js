const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

// Get all products for an organization
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ organizationId: req.user.orgId });
    res.json(products);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create product (Admin only)
router.post('/', auth, authorize(['Admin']), async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      organizationId: req.user.orgId,
    });
    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Seed some sample data (for testing)
router.post('/seed', auth, async (req, res) => {
  const sampleProducts = [
    { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5', category: 'Electronics', currentPrice: 399, cogs: 250, stockLevel: 50 },
    { sku: 'AAPL-AIRPODS-MAX', name: 'Apple AirPods Max', category: 'Electronics', currentPrice: 549, cogs: 400, stockLevel: 30 },
    { sku: 'LGT-MX-MASTER', name: 'Logitech MX Master 3S', category: 'Electronics', currentPrice: 99, cogs: 60, stockLevel: 100 },
  ].map(p => ({ ...p, organizationId: req.user.orgId }));

  try {
    await Product.insertMany(sampleProducts);
    res.json({ message: 'Seeded sample products' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
