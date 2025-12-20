require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

jest.mock('../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe.skip('Password Validation Integration Tests', () => {
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

  describe('Registration Password Validation', () => {
    it('should register user with valid password: Password123!', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john1@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('userId');
    });

    it('should register user with valid password: Test@456', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane1@example.com',
          password: 'Test@456',
          skillsHave: ['Python'],
          skillsWant: ['Django'],
        });

      expect(response.statusCode).toBe(200);
    });

    it('should reject password without uppercase: password123!', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john2@example.com',
          password: 'password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toBeDefined();
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.message).toContain('Password must be 6-14 chars');
    });

    it('should reject password without lowercase: PASSWORD123!', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john3@example.com',
          password: 'PASSWORD123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject password without digit: Password!', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john4@example.com',
          password: 'Password!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject password without special character: Password123', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john5@example.com',
          password: 'Password123',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject password shorter than 6 chars: Pass1!', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john6@example.com',
          password: 'Pass1!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject password longer than 14 chars: Password123!@#', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john7@example.com',
          password: 'Password123!@#',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        });

      expect(response.statusCode).toBe(400);
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should accept password with different special characters', async () => {
      const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
      
      for (const char of specialChars) {
        const response = await request(app)
        .post('/api/auth/register')
          .send({
            name: `John Doe ${char}`,
            email: `john${char}@example.com`,
            password: `Password123${char}`,
            skillsHave: ['JavaScript'],
            skillsWant: ['React'],
          });

        expect(response.statusCode).toBe(200);
        await User.deleteMany({});
      }
    });
  });

  describe('Login Password Validation', () => {
    beforeEach(async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Test User',
        email: 'testlogin@example.com',
        password: hashedPassword,
        isVerified: true,
      });
    });

    it('should login with valid password format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'Password123!',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should accept login with valid password (backend validation)', async () => {
      // Note: Backend login validation only checks if password is not empty
      // Frontend should handle format validation
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'Password123!',
        });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Verification Code Validation', () => {
    beforeEach(async () => {
      const bcrypt = require('bcryptjs');
      await User.create({
        name: 'Test User',
        email: 'testverify@example.com',
        password: await bcrypt.hash('Password123!', 10),
        verificationCode: '123456',
        isVerified: false,
      });
    });

    it('should verify with valid 6-digit numeric code', async () => {
      const user = await User.findOne({ email: 'testverify@example.com' });
      
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '123456',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Email verified successfully!');
    });

    it('should reject verification code with letters', async () => {
      const user = await User.findOne({ email: 'testverify@example.com' });
      
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '12345a',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toBeDefined();
      const codeError = response.body.errors.find(e => e.field === 'verificationCode');
      expect(codeError).toBeDefined();
      expect(codeError.message).toContain('only digits');
    });

    it('should reject verification code shorter than 6 digits', async () => {
      const user = await User.findOne({ email: 'testverify@example.com' });
      
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '12345',
        });

      expect(response.statusCode).toBe(400);
      const codeError = response.body.errors.find(e => e.field === 'verificationCode');
      expect(codeError).toBeDefined();
      expect(codeError.message).toContain('exactly 6 digits');
    });

    it('should reject verification code longer than 6 digits', async () => {
      const user = await User.findOne({ email: 'testverify@example.com' });
      
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '1234567',
        });

      expect(response.statusCode).toBe(400);
      const codeError = response.body.errors.find(e => e.field === 'verificationCode');
      expect(codeError).toBeDefined();
    });

    it('should reject empty verification code', async () => {
      const user = await User.findOne({ email: 'testverify@example.com' });
      
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          userId: user._id,
          verificationCode: '',
        });

      expect(response.statusCode).toBe(400);
      const codeError = response.body.errors.find(e => e.field === 'verificationCode');
      expect(codeError).toBeDefined();
    });
  });
});

