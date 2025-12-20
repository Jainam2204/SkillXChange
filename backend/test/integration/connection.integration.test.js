require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const ConnectionRequest = require('../../models/ConnectionRequest');
const Subscription = require('../../models/Subscription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;
let user1, user2, user3;
let token1, token2;

describe.skip('Connection Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    user1 = await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: hashedPassword,
      isVerified: true,
      freeConnectionLeft: 5,
      skillsHave: ['JavaScript', 'React'],
      skillsWant: ['Python', 'Node.js'],
    });

    user2 = await User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: hashedPassword,
      isVerified: true,
      freeConnectionLeft: 5,
      skillsHave: ['Python', 'Node.js'],
      skillsWant: ['JavaScript', 'React'],
    });

    user3 = await User.create({
      name: 'User 3',
      email: 'user3@example.com',
      password: hashedPassword,
      isVerified: true,
      freeConnectionLeft: 5,
      skillsHave: ['Java', 'Spring'],
      skillsWant: ['C++', 'Go'],
    });

    token1 = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET || 'test-secret');
    token2 = jwt.sign({ userId: user2._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
    await ConnectionRequest.deleteMany({});
    await Subscription.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ConnectionRequest.deleteMany({});
    await Subscription.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('GET /connect/suggestions', () => {
    it('should return suggestions based on skills', async () => {
      const response = await request(app)
        .get('/api/connect/suggestions')
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const suggestion = response.body.find(u => u._id.toString() === user2._id.toString());
      expect(suggestion).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/connect/suggestions');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /connect/request', () => {
    it('should send connection request successfully', async () => {
      const response = await request(app)
        .post('/api/connect/request')
        .set('Cookie', `authToken=${token1}`)
        .send({
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Connection request sent');

      const connReq = await ConnectionRequest.findOne({
        senderId: user1._id,
        receiverId: user2._id,
      });
      expect(connReq).toBeDefined();
      expect(connReq.status).toBe('pending');
    });

    it('should return 400 if receiverId missing', async () => {
      const response = await request(app)
        .post('/api/connect/request')
        .set('Cookie', `authToken=${token1}`)
        .send({});

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if user has no free connections', async () => {
      const userNoConnections = await User.create({
        name: 'No Connections',
        email: 'noconnections@example.com',
        password: await bcrypt.hash('Password123!', 10),
        isVerified: true,
        freeConnectionLeft: 0,
      });

      const token = jwt.sign({ userId: userNoConnections._id }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/api/connect/request')
        .set('Cookie', `authToken=${token}`)
        .send({
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Free tier used');
    });
  });

  describe('POST /connect/accept', () => {
    beforeEach(async () => {
      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'pending',
      });
    });

    it('should accept connection request successfully', async () => {
      const response = await request(app)
        .post('/api/connect/accept')
        .set('Cookie', `authToken=${token2}`)
        .send({
          senderId: user1._id,
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Connection request accepted');

      const connReq = await ConnectionRequest.findOne({
        senderId: user1._id,
        receiverId: user2._id,
      });
      expect(connReq.status).toBe('accepted');

      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser1.freeConnectionLeft).toBe(4);
      expect(updatedUser2.freeConnectionLeft).toBe(4);
    });

    it('should return 400 if request not found', async () => {
      await ConnectionRequest.deleteMany({});

      const response = await request(app)
        .post('/api/connect/accept')
        .set('Cookie', `authToken=${token2}`)
        .send({
          senderId: user1._id,
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /connect/reject', () => {
    beforeEach(async () => {
      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'pending',
      });
    });

    it('should reject connection request successfully', async () => {
      const response = await request(app)
        .post('/api/connect/reject')
        .set('Cookie', `authToken=${token2}`)
        .send({
          senderId: user1._id,
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Connection request rejected');

      const connReqReject = await ConnectionRequest.findOne({
        senderId: user1._id,
        receiverId: user2._id,
      });
      expect(connReqReject).toBeNull();
    });
  });

  describe('GET /connect/status', () => {
    it('should return pending status when user is sender', async () => {
      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'pending',
      });

      const response = await request(app)
        .get('/api/connect/status')
        .set('Cookie', `authToken=${token1}`)
        .query({
          senderId: user1._id,
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('pending');
    });

    it('should return received status when user is receiver', async () => {
      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'pending',
      });

      const response = await request(app)
        .get('/api/connect/status')
        .set('Cookie', `authToken=${token2}`)
        .query({
          senderId: user1._id,
          receiverId: user2._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('received');
    });
  });

  describe('GET /connect/connections', () => {
    it('should return accepted connections', async () => {
      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'accepted',
      });

      const response = await request(app)
        .get('/api/connect/connections')
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]._id.toString()).toBe(user2._id.toString());
    });

    it('should return empty array when no connections', async () => {
      await ConnectionRequest.deleteMany({});

      const response = await request(app)
        .get('/api/connect/connections')
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });
});

