const axios = require('axios');
const config = require("../config/config");

/**
 * Forwards an incoming Express request directly to a downstream service URL.
 * Preserves method, headers (incl. Authorization), query params, and body.
 *
 * @param {string}   serviceUrl  - Base URL of the downstream service (e.g. https://user-service.up.railway.app)
 * @param {string}   path        - Path to append (e.g. /api/users/register)
 * @param {object}   req         - Express request object
 * @param {object}   res         - Express response object
 */
async function forwardRequest(serviceUrl, path, req, res) {
  try {
    const url = `${serviceUrl}${path}`;
    // Forward safe headers only (drop hop-by-hop headers)
    const headers = {};
    if (req.headers['content-type'])  headers['content-type']  = req.headers['content-type'];
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['x-correlation-id']) headers['x-correlation-id'] = req.headers['x-correlation-id'];

    const response = await axios({
      method:  req.method,
      url,
      headers,
      params:  req.query,
      data:    req.body,
      timeout: 10000, // 10 second timeout
      validateStatus: () => true, // Pass ALL HTTP status codes through (don't throw on 4xx/5xx)
    });

    // Forward the downstream response status + body back to the client
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[FORWARD ERROR] ${req.method} ${req.path} →`, err.message);
    res.status(503).json({
      status:  503,
      error:   'Service Unavailable',
      message: 'Downstream service is currently unavailable. Please try again later.',
    });
  }
}

module.exports = { forwardRequest };

