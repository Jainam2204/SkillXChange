// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.EMAIL_FROM = 'test@example.com';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '6.0.5';

// Dummy Cloudinary env to avoid runtime errors in tests
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-key';
process.env.CLOUDINARY_SECRET_KEY = process.env.CLOUDINARY_SECRET_KEY || 'test-secret';

// Mock nanoid (ESM) for Jest (CJS)
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'TESTMEETING',
}));

// Mock logger to prevent file system errors during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
}));

// Mock rate limiters to avoid 429s during test runs
jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
  uploadLimiter: (req, res, next) => next(),
}));

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Increase timeout for MongoDB Memory Server
jest.setTimeout(30000);
