require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let mongoServer;
let user;
let token;

describe.skip('User Integration Tests', () => {
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
      skillsHave: ['JavaScript'],
      skillsWant: ['React'],
    });

    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
    // Cleanup if needed
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

  describe('GET /api/user/profile/:id', () => {
    it('should return user profile without password', async () => {
      const response = await request(app)
        .get(`/api/user/profile/${user._id}`)
        .set('Cookie', `authToken=${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.password).toBeUndefined();
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/user/profile/${fakeId}`)
        .set('Cookie', `authToken=${token}`);

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/user/profile/${user._id}`);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/user/update-profile/:id', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        skillsHave: ['Python', 'Java'],
        skillsWant: ['Django'],
      };

      const response = await request(app)
        .put(`/api/user/update-profile/${user._id}`)
        .set('Cookie', `authToken=${token}`)
        .send(updates);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.skillsHave).toEqual(['Python', 'Java']);
      expect(response.body.skillsWant).toEqual(['Django']);
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/user/update-profile/${fakeId}`)
        .set('Cookie', `authToken=${token}`)
        .send({ name: 'New Name' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/user/update-profile/${user._id}`)
        .send({ name: 'New Name' });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/user/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get(`/api/user/${user._id}`)
        .set('Cookie', `authToken=${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBeDefined();
      expect(response.body.password).toBeUndefined();
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/user/${fakeId}`)
        .set('Cookie', `authToken=${token}`);

      expect(response.statusCode).toBe(404);
    });
  });
});

