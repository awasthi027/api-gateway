const express = require('express');
const { validate } = require('../middleware/validator');
const config       = require('../config/config');
const { forwardRequest } = require('../utils/forwardRequest');

const router = express.Router();

// ─── Routes ───────────────────────────────────────────────────────────────

// All order routes are protected (auth applied globally in app.js)
router.post('/', validate('createOrder'), (req, res) =>
  forwardRequest(config.services.order, '/api/orders', req, res));

router.get('/', (req, res) =>
  forwardRequest(config.services.order, '/api/orders', req, res));

router.get('/:id', (req, res) =>
  forwardRequest(config.services.order, `/api/orders/${req.params.id}`, req, res));

router.patch('/:id/status', (req, res) =>
  forwardRequest(config.services.order, `/api/orders/${req.params.id}/status`, req, res));

module.exports = router;