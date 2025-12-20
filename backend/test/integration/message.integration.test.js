require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Message = require('../../models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => {
      const mockStream = {
        end: jest.fn(),
        on: jest.fn(),
      };
      setTimeout(() => {
        callback(null, {
          secure_url: 'https://example.com/file.pdf',
          public_id: 'test-file-id',
        });
      }, 10);
      return mockStream;
    }),
  },
}));

let mongoServer;
let user1, user2;
let token1;

describe('Message Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    user1 = await User.create({
      name: 'Sender',
      email: 'sender@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    user2 = await User.create({
      name: 'Receiver',
      email: 'receiver@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    token1 = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
    await Message.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('POST /messages', () => {
    it('should send a text message successfully', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', `authToken=${token1}`)
        .send({
          receiverId: user2._id,
          content: 'Hello, this is a test message',
          type: 'text',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.content).toBe('Hello, this is a test message');
      expect(response.body.type).toBe('text');
      expect(response.body.sender._id.toString()).toBe(user1._id.toString());
      expect(response.body.receiver._id.toString()).toBe(user2._id.toString());
    });

    it('should return 400 if receiverId missing', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', `authToken=${token1}`)
        .send({
          content: 'Test message',
          type: 'text',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Receiver ID is required');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          receiverId: user2._id,
          content: 'Test message',
          type: 'text',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /messages/:userId', () => {
    beforeEach(async () => {
      await Message.create({
        sender: user1._id,
        receiver: user2._id,
        content: 'Message 1',
        type: 'text',
      });

      await Message.create({
        sender: user2._id,
        receiver: user1._id,
        content: 'Message 2',
        type: 'text',
      });
    });

    it('should get messages between users', async () => {
      const response = await request(app)
        .get(`/api/messages/${user2._id}`)
        .set('Cookie', `authToken=${token1}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/messages/${user2._id}`);

      expect(response.statusCode).toBe(401);
    });
  });
});

