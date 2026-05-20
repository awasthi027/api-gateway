const express = require('express');
const { validate }    = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const config          = require('../config/config');
const { forwardRequest } = require('../utils/forwardRequest');

const router = express.Router();

// ─── Routes ───────────────────────────────────────────────────────────────

router.post('/register', authLimiter, validate('register'), (req, res) =>
  forwardRequest(config.services.user, '/api/users/register', req, res));

router.post('/login', authLimiter, validate('login'), (req, res) =>
  forwardRequest(config.services.user, '/api/users/login', req, res));

router.get('/:id', (req, res) =>
  forwardRequest(config.services.user, `/api/users/${req.params.id}`, req, res));

router.put('/:id', (req, res) =>
  forwardRequest(config.services.user, `/api/users/${req.params.id}`, req, res));

router.delete('/:id', (req, res) =>
  forwardRequest(config.services.user, `/api/users/${req.params.id}`, req, res));

module.exports = router;