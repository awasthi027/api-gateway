jest.mock('../utils/forwardRequest', () => ({
  forwardRequest: jest.fn((serviceUrl, path, req, res) =>
    res.status(200).json({
      serviceUrl,
      path,
      refreshToken: req.body.refreshToken,
      accessToken: 'new-access-token',
    })
  ),
}));

const request = require('supertest');
const app = require('../app');
const config = require('../config/config');
const { forwardRequest } = require('../utils/forwardRequest');

describe('Refresh Token API', () => {
  beforeEach(() => {
    forwardRequest.mockClear();
  });

  test('should allow POST /api/users/refresh without an access token and forward the request', async () => {
    const refreshToken = 'valid-refresh-token';

    const res = await request(app)
      .post('/api/users/refresh')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      serviceUrl: config.services.user,
      path: '/api/users/refresh',
      refreshToken,
      accessToken: 'new-access-token',
    });
    expect(forwardRequest).toHaveBeenCalledTimes(1);
    expect(forwardRequest).toHaveBeenCalledWith(
      config.services.user,
      '/api/users/refresh',
      expect.objectContaining({
        method: 'POST',
        originalUrl: '/api/users/refresh',
        body: { refreshToken },
      }),
      expect.any(Object)
    );
  });

  test('should return 400 when refreshToken is missing', async () => {
    const res = await request(app)
      .post('/api/users/refresh')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/refreshtoken/i)])
    );
    expect(forwardRequest).not.toHaveBeenCalled();
  });
});


