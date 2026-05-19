const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const config         = require('./config/config');
const { correlationId, requestLogger } = require('./middleware/logger');
const { globalLimiter }                = require('./middleware/rateLimiter');
const { authenticate }                 = require('./middleware/auth');
const userRoutes                       = require('./routes/userRoutes');
const productRoutes                    = require('./routes/productRoutes');
const orderRoutes                      = require('./routes/orderRoutes');

const app = express();

// ─── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Logging & Correlation ─────────────────────────────────────────────────
app.use(correlationId);
app.use(requestLogger);

// ─── Rate Limiting (Global) ────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Health Check (no auth required) ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'UP',
    timestamp: new Date().toISOString(),
    services: {
      user:    config.services.user,
      product: config.services.product,
      order:   config.services.order,
    },
  });
});

// ─── Authentication (applied before routes) ────────────────────────────────
app.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status:  404,
    error:   'Not Found',
    message: `Route ${req.method} ${req.path} does not exist.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.correlationId}:`, err.message);
  res.status(500).json({
    status:  500,
    error:   'Internal Server Error',
    message: 'Something went wrong. Please try again later.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`✅ API Gateway running on port ${config.port}`);
    console.log(`📦 User Service    → ${config.services.user}`);
    console.log(`📦 Product Service → ${config.services.product}`);
    console.log(`📦 Order Service   → ${config.services.order}`);
  });
}

module.exports = app; // Export for testing