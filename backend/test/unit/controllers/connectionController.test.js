const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectionController = require('../../../controllers/connectioncontroller');
const User = require('../../../models/User');
const ConnectionRequest = require('../../../models/ConnectionRequest');
const bcrypt = require('bcryptjs');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe.skip('Connection Controller Unit Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await ConnectionRequest.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ConnectionRequest.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('fetchSuggestions', () => {
    it('should return suggestions successfully', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'hashed',
        skillsHave: ['JavaScript'],
        skillsWant: ['Python'],
      });

      await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'hashed',
        skillsHave: ['Python'],
        skillsWant: ['JavaScript'],
      });

      const req = {
        user: { _id: user1._id },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await connectionController.fetchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('sendRequest', () => {
    it('should send connection request successfully', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
        freeConnectionLeft: 5,
      });

      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
      });

      const req = {
        user: { _id: sender._id },
        body: { receiverId: receiver._id },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await connectionController.sendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Connection request sent',
        })
      );
    });
  });

  describe('acceptRequest', () => {
    it('should accept connection request successfully', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
        freeConnectionLeft: 5,
      });

      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
        freeConnectionLeft: 5,
      });

      await ConnectionRequest.create({
        senderId: sender._id,
        receiverId: receiver._id,
        status: 'pending',
      });

      const req = {
        body: {
          senderId: sender._id,
          receiverId: receiver._id,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await connectionController.acceptRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Connection request accepted',
        })
      );
    });
  });

  describe('rejectRequest', () => {
    it('should reject connection request successfully', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
      });

      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
      });

      await ConnectionRequest.create({
        senderId: sender._id,
        receiverId: receiver._id,
        status: 'pending',
      });

      const req = {
        body: {
          senderId: sender._id,
          receiverId: receiver._id,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await connectionController.rejectRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Connection request rejected',
        })
      );
    });
  });

  describe('fetchConnections', () => {
    it('should return connections successfully', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'hashed',
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'hashed',
      });

      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'accepted',
      });

      const req = {
        user: { _id: user1._id },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await connectionController.fetchConnections(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
      });
    });
  });
});

