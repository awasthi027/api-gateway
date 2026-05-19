const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { validate } = require('../middleware/validator');
const config       = require('../config/config');

const router = express.Router();

const productProxy = createProxyMiddleware({
  target:       config.services.product,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      res.status(503).json({
        status:  503,
        error:   'Service Unavailable',
        message: 'Product Service is currently unavailable. Please try again later.',
      });
    },
  },
});

// Public
router.get('/',    productProxy);
router.get('/:id', productProxy);

// Protected (auth applied globally)
router.post('/',      validate('createProduct'), productProxy);
router.put('/:id',    productProxy);
router.delete('/:id', productProxy);

module.exports = router;