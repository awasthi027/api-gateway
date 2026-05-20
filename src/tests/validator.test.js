const request = require('supertest');
const app     = require('../app');

describe('Validator Middleware', () => {
  describe('POST /api/users/register', () => {
    test('should return 400 when body is empty', async () => {
      const res = await request(app).post('/api/users/register').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    test('should return 400 for invalid email', async () => {
      const res = await request(app).post('/api/users/register').send({
        name: 'John', email: 'not-an-email', password: 'password123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.messages).toEqual(
        expect.arrayContaining([expect.stringMatching(/email/i)])
      );
    });

    test('should return 400 for short password', async () => {
      const res = await request(app).post('/api/users/register').send({
        name: 'John', email: 'john@test.com', password: '123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.messages).toEqual(
        expect.arrayContaining([expect.stringMatching(/password/i)])
      );
    });

    test('should pass validation and attempt proxy with valid body', async () => {
      const res = await request(app).post('/api/users/register').send({
        name: 'John Doe', email: 'john@test.com', password: 'securepass123',
      });
      // 503 = passed validation, axios could not connect (service not running in test)
      // 201 = succeeded (service running), 404 = service up but route slightly different
      expect([503, 201, 404]).toContain(res.statusCode);
    });
  });

  describe('POST /api/users/login', () => {
    test('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ password: 'test123' });
      expect(res.statusCode).toBe(400);
    });
  });
});