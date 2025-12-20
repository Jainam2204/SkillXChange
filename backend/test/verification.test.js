const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('POST /api/auth/verify', () => {
  let mongoServer;

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

  it('should verify a user with a valid verification code', async () => {
    const user = await User.create({
      name: 'Test Verify',
      email: 'verify@example.com',
      password: 'Password123!',
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
  });

  it('should return 400 for an invalid verification code', async () => {
    const user = await User.create({
      name: 'Test Verify',
      email: 'verify@example.com',
      password: 'Password123!',
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

  it('should return 400 for a nonexistent userId', async () => {
    const nonexistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post('/api/auth/verify')
      .send({
        userId: nonexistentId,
        verificationCode: '123456',
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'User not found');
  });
});