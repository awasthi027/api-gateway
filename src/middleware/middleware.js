const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Attach a unique correlation ID to every incoming request
const correlationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};

// Custom Morgan token that includes the correlation ID
morgan.token('correlation-id', (req) => req.correlationId);

const requestLogger = morgan(
  '[:date[iso]] :method :url :status :response-time ms — ID::correlation-id'
);

module.exports = { correlationId, requestLogger };