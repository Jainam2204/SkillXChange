require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// Mock sendEmail to prevent actual email sending during tests
jest.mock('../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Auth Integration Tests', () => {
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Verification email sent.');
      expect(response.body).toHaveProperty('userId');

      const user = await User.findById(response.body.userId);
      expect(user).toBeTruthy();
      expect(user.email).toBe('john@example.com');
      expect(user.isVerified).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123!', 10),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login verified user successfully', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login Success');
      expect(response.body).toHaveProperty('user');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 403 for unverified user', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Test User',
        email: 'unverified@example.com',
        password: hashedPassword,
        isVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'Password123!',
        });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify email successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        verificationCode: '123456',
        isVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '123456',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Email verified successfully!');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationCode).toBeNull();
    });

    it('should return 400 for invalid verification code', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        verificationCode: '123456',
        isVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '654321',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid verification code');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true,
      });

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `authToken=${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});

