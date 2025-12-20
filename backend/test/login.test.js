const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe.skip('POST /api/auth/login', () => {
  let user;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      isVerified: true,
    });
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

  it('should successfully log in a verified user with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.message).toBe('Login Success');
  });

  it('should return 400 for incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should return 400 if user is not verified', async () => {
    await User.create({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'Password123!',
      isVerified: false,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unverified@example.com',
        password: 'Password123!',
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should return 400 for a nonexistent email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });
});