const jwt     = require('jsonwebtoken');
const request = require('supertest');
const app     = require('../app');

// ── Shared valid JWT (mirrors auth.test.js approach) ─────────────────────────
const base64Secret = process.env.JWT_SECRET || 'fallback_secret';
const secretBuffer = Buffer.from(base64Secret, 'base64');
const validToken   = jwt.sign(
  { userId: '123', role: 'user', email: 'test@test.com' },
  secretBuffer,
  {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer:    process.env.ISSUER   || 'user-service',
    audience:  process.env.AUDIENCE || 'api-gateway',
  }
);

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

// ─── Order Validator ──────────────────────────────────────────────────────────

const VALID_ORDER = {
  customerName: 'Ashish Awasthi',
  address: 'Bangalore, India, 560048',
  paymentType: 'UPI',
  products: [
    {
      productId: 'd3e4f262-6af5-4e8c-932f-b6c604f76295',
      productName: 'Keyboard',
      price: 59.99,
    },
    {
      productId: '40ad8af8-2e8e-48e4-9d8e-2946f333f640',
      productName: 'Mouse',
      price: 19.99,
    },
  ],
};

describe('POST /api/orders — createOrder Validator', () => {
  const post = (body) =>
    request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send(body);

  test('should pass with a valid order body (proxy attempt)', async () => {
    const res = await post(VALID_ORDER);
    // 503 = validation passed, upstream not running; other 2xx/4xx from a live service
    expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
    // must NOT be a gateway-level validation error
    if (res.statusCode === 400) {
      expect(res.body.error).not.toBe('Validation Error');
    }
  });

  test('should return 400 when body is empty', async () => {
    const res = await post({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  test('should return 400 when customerName is missing', async () => {
    const { customerName, ...body } = VALID_ORDER;
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/customerName/i)])
    );
  });

  test('should return 400 when address is missing', async () => {
    const { address, ...body } = VALID_ORDER;
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/address/i)])
    );
  });

  test('should return 400 when paymentType is missing', async () => {
    const { paymentType, ...body } = VALID_ORDER;
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/paymentType/i)])
    );
  });

  test('should return 400 for an invalid paymentType', async () => {
    const res = await post({ ...VALID_ORDER, paymentType: 'CRYPTO' });
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/paymentType/i)])
    );
  });

  test('should return 400 when products array is empty', async () => {
    const res = await post({ ...VALID_ORDER, products: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/products/i)])
    );
  });

  test('should return 400 when products is missing', async () => {
    const { products, ...body } = VALID_ORDER;
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/products/i)])
    );
  });

  test('should return 400 when a product is missing productId', async () => {
    const body = {
      ...VALID_ORDER,
      products: [{ productName: 'Keyboard', price: 59.99 }],
    };
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/productId/i)])
    );
  });

  test('should return 400 when a product has an invalid UUID for productId', async () => {
    const body = {
      ...VALID_ORDER,
      products: [{ productId: 'not-a-uuid', productName: 'Keyboard', price: 59.99 }],
    };
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/productId/i)])
    );
  });

  test('should return 400 when a product is missing productName', async () => {
    const body = {
      ...VALID_ORDER,
      products: [{ productId: 'd3e4f262-6af5-4e8c-932f-b6c604f76295', price: 59.99 }],
    };
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/productName/i)])
    );
  });

  test('should return 400 when a product has a negative price', async () => {
    const body = {
      ...VALID_ORDER,
      products: [
        { productId: 'd3e4f262-6af5-4e8c-932f-b6c604f76295', productName: 'Keyboard', price: -1 },
      ],
    };
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/price/i)])
    );
  });

  test('should return 400 when a product is missing price', async () => {
    const body = {
      ...VALID_ORDER,
      products: [
        { productId: 'd3e4f262-6af5-4e8c-932f-b6c604f76295', productName: 'Keyboard' },
      ],
    };
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/price/i)])
    );
  });
});
