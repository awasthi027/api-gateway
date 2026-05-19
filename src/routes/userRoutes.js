const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { fixRequestBody } = require('http-proxy-middleware');
const { validate }    = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const config          = require('../config/config');

const router = express.Router();

const userProxy = createProxyMiddleware({
  target:       config.services.user,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      res.status(503).json({
        status:  503,
        error:   'Service Unavailable',
        message: 'User Service is currently unavailable. Please try again later.',
      });
    },
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────

// Validation runs first, if it passes → hardcoded response
router.post('/register', authLimiter, validate('register'), userProxy);
router.post('/login',    authLimiter, validate('login'),    userProxy);

// These still proxy (no mock needed yet)
router.get('/:id',    userProxy);
router.put('/:id',    userProxy);
router.delete('/:id', userProxy);

module.exports = router;