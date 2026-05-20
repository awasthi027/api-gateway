require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  issuer: process.env.ISSUER || 'user-service',
  audience: process.env.AUDIENCE || 'api-gateway',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret',
  },
  services: {
    user:    process.env.USER_SERVICE_URL    || 'http://localhost:8081',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8082',
    order:   process.env.ORDER_SERVICE_URL   || 'http://localhost:8083',
  },
  rateLimit: {
    windowMs:    parseInt(process.env.RATE_LIMIT_WINDOW_MS)    || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};