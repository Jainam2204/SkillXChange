const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authMiddleware = require('../../../middleware/authMiddleware');
const User = require('../../../models/User');

let mongoServer;

describe.skip('Auth Middleware Unit Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should call next() when valid token is provided', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      isVerified: true,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');
    const req = {
      cookies: { authToken: token },
    };
    const res = {};
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
  });

  it('should return 401 when no token is provided', async () => {
    const req = {
      cookies: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const req = {
      cookies: { authToken: 'invalid-token' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not found', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ userId: fakeUserId }, process.env.JWT_SECRET || 'test-secret');
    
    const req = {
      cookies: { authToken: token },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle expired token', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      isVerified: true,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    const req = {
      cookies: { authToken: token },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });
});

