const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 15 : 2,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, 
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  message: {
    error: 'Too many file uploads, please try again later.',
  },
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
};

