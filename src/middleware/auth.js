const jwt    = require('jsonwebtoken');
const config = require('../config/config');

// Routes that do NOT require a token
const PUBLIC_ROUTES = [
  { path: '/api/users/register', method: 'POST' },
  { path: '/api/users/login',    method: 'POST' },
  { path: '/api/users/refresh',  method: 'POST' },
  { path: '/api/products',       method: 'GET'  },
  { path: '/health',             method: 'GET'  },
];

const isPublicRoute = (req) =>
  PUBLIC_ROUTES.some(
    (route) =>
      req.path.startsWith(route.path) && req.method === route.method
  );

const authenticate = (req, res, next) => {
  // Skip auth for public routes
  if (isPublicRoute(req)) return next();

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status:  401,
      error:   'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];
// Same Base64 secret used in your Java JwtService
  const base64Secret = config.jwt.secret
  const secretBuffer = Buffer.from(base64Secret, 'base64');
// ── Verify & extract ─────────────────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, secretBuffer, {
      algorithms: ['HS256'],
      issuer: config.issuer,
      audience: config.audience
    });
    // Attach user info to headers so downstream services can read it
    req.headers['x-user-id']   = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (err) {
    console.log(`Error Info:   → ${err}`);
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired. Please log in again.'
        : 'Invalid token.';
    return res.status(401).json({ status: 401, error: 'Unauthorized', message });
  }
};
module.exports = { authenticate, isPublicRoute };