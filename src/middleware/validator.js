const Joi = require('joi');

// Reusable schemas for each service's key endpoints
const schemas = {
  // User Service
  register: Joi.object({
    name:     Joi.string().min(2).max(50).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().trim().required(),
  }),

  // Product Service
  createProduct: Joi.object({
    name:        Joi.string().min(2).max(100).required(),
    price:       Joi.number().positive().required(),
    description: Joi.string().max(500).optional(),
    category:    Joi.string().optional(),
    stock:       Joi.number().integer().min(0).required(),
  }),

  // Order Service
  createOrder: Joi.object({
    customerName: Joi.string().min(2).max(100).required(),
    address:      Joi.string().min(5).max(200).required(),
    paymentType:  Joi.string().valid('UPI', 'CARD', 'CASH', 'NET_BANKING').required(),
    products: Joi.array()
      .items(
        Joi.object({
          productId:   Joi.string().uuid().required(),
          productName: Joi.string().min(1).max(100).required(),
          price:       Joi.number().positive().required(),
        })
      )
      .min(1)
      .required(),
  }),
};

// Middleware factory — call validate('schemaName') on a route
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(); // No schema defined, skip

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
    return res.status(400).json({
      status:  400,
      error:   'Validation Error',
      messages: errors,
    });
  }

  next();
};

module.exports = { validate, schemas };