const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendResetEmail } = require('../services/emailService');

const { auth } = require('../middleware/auth');


// Helper to sign JWT with Promise
const signToken = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });
};

// @route   POST api/auth/signup
// @desc    Register user and organization
router.post('/signup', async (req, res, next) => {
  const { email, password, organizationName, role } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create Organization
    const organization = new Organization({ name: organizationName });
    await organization.save();

    // Create User
    user = new User({
      email,
      password,
      organizationId: organization._id,
      role: role || 'Pricing Analyst',
    });
    await user.save();

    // Return JWT
    const payload = {
      userId: user.id,
      orgId: user.organizationId,
      role: user.role,
    };

    const token = await signToken(payload);
    res.json({ token });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = {
      userId: user.id,
      orgId: user.organizationId,
      role: user.role,
    };

    const token = await signToken(payload);
    res.json({ token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Still return success for security, but don't send mail
      return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
    }

    // Generate a short-lived reset token (1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Create the reset link (frontend URL)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    // Send the email
    const emailSent = await sendResetEmail(email, resetLink);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send email. Check SMTP settings.' });
    }
    
    res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
});



// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    const organization = await Organization.findById(req.user.orgId);
    res.json({ user, organization });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password; // Mongoose middleware will hash it
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;

