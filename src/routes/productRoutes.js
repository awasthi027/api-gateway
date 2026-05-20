const express = require('express');
const { validate } = require('../middleware/validator');
const config       = require('../config/config');
const { forwardRequest } = require('../utils/forwardRequest');

const router = express.Router();

// ─── Routes ───────────────────────────────────────────────────────────────

// Public
router.get('/', (req, res) =>
  forwardRequest(config.services.product, '/api/products', req, res));

router.get('/:id', (req, res) =>
  forwardRequest(config.services.product, `/api/products/${req.params.id}`, req, res));

// Protected (auth applied globally in app.js)
router.post('/', validate('createProduct'), (req, res) =>
  forwardRequest(config.services.product, '/api/products', req, res));

router.put('/:id', (req, res) =>
  forwardRequest(config.services.product, `/api/products/${req.params.id}`, req, res));

router.delete('/:id', (req, res) =>
  forwardRequest(config.services.product, `/api/products/${req.params.id}`, req, res));

module.exports = router;