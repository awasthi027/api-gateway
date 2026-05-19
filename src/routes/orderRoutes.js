const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { validate } = require('../middleware/validator');
const config       = require('../config/config');

const router = express.Router();

const orderProxy = createProxyMiddleware({
  target:       config.services.order,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      res.status(503).json({
        status:  503,
        error:   'Service Unavailable',
        message: 'Order Service is currently unavailable. Please try again later.',
      });
    },
  },
});

// All order routes are protected
router.post('/',    validate('createOrder'), orderProxy);
router.get('/',     orderProxy);
router.get('/:id',  orderProxy);
router.patch('/:id/status', orderProxy);

module.exports = router;