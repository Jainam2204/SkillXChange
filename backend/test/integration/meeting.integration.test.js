require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Meeting = require('../../models/Meeting');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let mongoServer;
let user1, user2;
let token1;

describe.skip('Meeting Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    user1 = await User.create({
      name: 'Host User',
      email: 'host@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    user2 = await User.create({
      name: 'Invitee User',
      email: 'invitee@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    token1 = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
    await Meeting.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Meeting.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('POST /meetings', () => {
    it('should create a meeting successfully', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Cookie', `authToken=${token1}`)
        .send({
          title: 'Test Meeting',
          inviteeId: user2._id,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('meetingId');
      expect(response.body.title).toBe('Test Meeting');

      const meeting = await Meeting.findOne({ meetingId: response.body.meetingId });
      expect(meeting).toBeDefined();
      expect(meeting.hostId.toString()).toBe(user1._id.toString());
    });

    it('should create meeting without title', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Cookie', `authToken=${token1}`)
        .send({
          inviteeId: user2._id,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('meetingId');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send({
          title: 'Test Meeting',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /meetings/:id', () => {
    it('should get meeting by id successfully', async () => {
      const meeting = await Meeting.create({
        meetingId: 'TEST123456',
        hostId: user1._id,
        title: 'Test Meeting',
        participants: [user1._id],
      });

      const response = await request(app)
        .get(`/api/meetings/${meeting.meetingId}`)
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.meetingId).toBe('TEST123456');
      expect(response.body.title).toBe('Test Meeting');
      expect(response.body.hostId.toString()).toBe(user1._id.toString());
    });

    it('should return 404 if meeting not found', async () => {
      const response = await request(app)
        .get('/api/meetings/NONEXISTENT')
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Meeting not found');
    });
  });
});

