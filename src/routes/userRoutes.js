const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { validate }    = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const config          = require('../config/config');

const router = express.Router();

const userProxy = createProxyMiddleware({
  target:       config.services.user,
  changeOrigin: true,
  pathRewrite:  { '^/api/users': '/api/users' },
  on: {
    error: (err, req, res) => {
      res.status(503).json({
        status:  503,
        error:   'Service Unavailable',
        message: 'User Service is currently unavailable. Please try again later.',
      });
    },
  },
});

// ─── Hardcoded handlers (until Java User Service is ready) ────────────────

const mockRegister = (req, res) => {
  const { name, email } = req.body;
  console.log(`[MOCK] Register called → name: ${name}, email: ${email}`);
  return res.status(201).json({
    status:  201,
    message: 'User registered successfully (mock)',
    data: {
      userId: 'mock-user-id-123',
      name,
      email,
    },
  });
};

const mockLogin = (req, res) => {
  const { email } = req.body;
  console.log(`[MOCK] Login called → email: ${email}`);
  return res.status(200).json({
    status:  200,
    message: 'Login successful (mock)',
    data: {
      token: 'mock-jwt-token-abc123',
      email,
    },
  });
};

// ─── Routes ───────────────────────────────────────────────────────────────

// Validation runs first, if it passes → hardcoded response
router.post('/register', authLimiter, validate('register'), mockRegister);
router.post('/login',    authLimiter, validate('login'),    mockLogin);

// These still proxy (no mock needed yet)
router.get('/:id',    userProxy);
router.put('/:id',    userProxy);
router.delete('/:id', userProxy);

module.exports = router;