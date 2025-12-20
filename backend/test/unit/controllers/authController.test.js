const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Auth Controller Unit Tests', () => {
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

  describe('register', () => {
    it('should register user and return success response', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Verification email sent.',
          userId: expect.any(mongoose.Types.ObjectId),
        })
      );
    });

    it('should return 400 when user already exists', async () => {
      // Seed an existing user to trigger duplicate error
      await User.create({
        name: 'Existing User',
        email: 'john@example.com',
        password: 'hashed',
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true,
      });
    });

    it('should login verified user successfully', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login Success',
          user: expect.any(Object),
        })
      );
      expect(res.cookie).toHaveBeenCalled();
    });

    it('should return 403 for unverified user', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: hashedPassword,
        isVerified: false,
      });

      const req = {
        body: {
          email: 'unverified@example.com',
          password: 'Password123!',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('me', () => {
    it('should return user profile', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        isVerified: true,
      });

      const req = {
        user: { _id: user._id },
      };
      const res = {
        json: jest.fn(),
      };

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        verificationCode: '123456',
        isVerified: false,
      });

      const req = {
        body: {
          userId: user._id,
          verificationCode: '123456',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email verified successfully!',
        })
      );
    });
  });

  describe('logoutUser', () => {
    it('should logout successfully', async () => {
      const req = {};
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      authController.logoutUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

