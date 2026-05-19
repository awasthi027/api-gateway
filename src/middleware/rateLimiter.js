const rateLimit = require('express-rate-limit');
const config    = require('../config/config');

// Global rate limiter — applies to all routes
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.maxRequests,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders:   false,
  message: {
    status:  429,
    error:   'Too Many Requests',
    message: `You have exceeded the request limit. Please try again later.`,
  },
  keyGenerator: (req) => req.ip,  // Limit by client IP
});

// Strict limiter for sensitive routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,              // Only 10 attempts per window
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    status:  429,
    error:   'Too Many Requests',
    message: 'Too many auth attempts. Please wait 15 minutes.',
  },
});

module.exports = { globalLimiter, authLimiter };