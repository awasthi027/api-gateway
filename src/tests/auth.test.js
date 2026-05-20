const jwt     = require('jsonwebtoken');
const request = require('supertest');
const app     = require('../app');

const base64Secret    = process.env.JWT_SECRET || 'fallback_secret';
// Same Base64 secret used in your Java JwtService
const secretBuffer = Buffer.from(base64Secret, 'base64');
// ── Sign ─────────────────────────────────────────────────────────────────
const validToken = jwt.sign(
    { userId: '123', role: 'user', email: 'test@test.com' },   // payload
    secretBuffer,          // decoded key bytes — MUST match Java
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'user-service',
      audience: 'api-gateway'
    }
);

describe('Auth Middleware', () => {
  test('GET /health should be accessible without a token', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('Protected route should return 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('Protected route should return 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer not_a_real_token');
    expect(res.statusCode).toBe(401);
  });

  test('Protected route should return 401 with expired token', async () => {
    const expiredToken = jwt.sign(
        { userId: '123', role: 'user', email: 'test@test.com' },   // payload
        secretBuffer,          // decoded key bytes — MUST match Java
        {
          algorithm: 'HS256',
          expiresIn: '-1s',
          issuer: 'user-service',
          audience: 'api-gateway'
        }
    );
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('Valid token should attach user info to headers', async () => {
    // Route will fail at proxy (503) but NOT at auth (401)
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).not.toBe(401);
  });
});