const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authService = require('../../../services/authService');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Auth Service Unit Tests', () => {
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

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      };

      const user = await authService.registerUser(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.verificationCode).toBeDefined();
      expect(user.verificationCode.length).toBe(6);
      expect(user.isVerified).toBe(false);
    });

    it('should throw error if user already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedPassword',
      });

      await expect(
        authService.registerUser({
          name: 'New User',
          email: 'existing@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        })
      ).rejects.toThrow('User already exists');
    });

    it('should throw error if skills exceed limit', async () => {
      await expect(
        authService.registerUser({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          skillsHave: ['JS', 'Python', 'Java', 'C++'], // 4 skills
          skillsWant: ['React'],
        })
      ).rejects.toThrow('Maximum 3 skills allowed per field');
    });
  });

  describe('loginUser', () => {
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
      const result = await authService.loginUser({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.unverified).toBeUndefined();
    });

    it('should return unverified status for unverified user', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: hashedPassword,
        isVerified: false,
      });

      const result = await authService.loginUser({
        email: 'unverified@example.com',
        password: 'Password123!',
      });

      expect(result.unverified).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeUndefined();
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.loginUser({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.loginUser({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error when email is missing', async () => {
      await expect(
        authService.loginUser({
          password: 'Password123!',
        })
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error when password is missing', async () => {
      await expect(
        authService.loginUser({
          email: 'test@example.com',
        })
      ).rejects.toThrow('Email and password are required');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        isVerified: true,
      });

      const profile = await authService.getUserProfile(user._id);

      expect(profile).toBeDefined();
      expect(profile.email).toBe('test@example.com');
      expect(profile.password).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(authService.getUserProfile(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user email successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        verificationCode: '123456',
        isVerified: false,
      });

      const message = await authService.verifyUserEmail(user._id, '123456');

      expect(message).toBe('Email verified successfully!');
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationCode).toBeNull();
    });

    it('should throw error for invalid verification code', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        verificationCode: '123456',
        isVerified: false,
      });

      await expect(
        authService.verifyUserEmail(user._id, '654321')
      ).rejects.toThrow('Invalid verification code');
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        authService.verifyUserEmail(fakeId, '123456')
      ).rejects.toThrow('User not found');
    });
  });
});

