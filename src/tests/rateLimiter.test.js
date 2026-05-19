const request = require('supertest');
const app     = require('../app');

describe('Rate Limiter Middleware', () => {
  test('Response should include RateLimit headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });

  test('Auth routes should have stricter rate limit headers', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@test.com', password: 'password123' });
    // Auth limiter max is 10, global is 100
    const limit = parseInt(res.headers['ratelimit-limit']);
    expect(limit).toBeLessThanOrEqual(10);
  });
});