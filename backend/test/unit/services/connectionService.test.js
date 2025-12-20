const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getUserSuggestions,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionStatus,
  getUserConnections,
} = require('../../../services/connection');
const User = require('../../../models/User');
const ConnectionRequest = require('../../../models/ConnectionRequest');
const Subscription = require('../../../models/Subscription');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Connection Service Unit Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
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

  describe('getUserSuggestions', () => {
    it('should return users with matching skills', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'hashed',
        skillsHave: ['JavaScript', 'React'],
        skillsWant: ['Python', 'Node.js'],
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'hashed',
        skillsHave: ['Python', 'Node.js'],
        skillsWant: ['JavaScript', 'React'],
      });

      const suggestions = await getUserSuggestions(user1._id);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]._id.toString()).toBe(user2._id.toString());
    });

    it('should return empty array when no matches found', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'hashed',
        skillsHave: ['JavaScript'],
        skillsWant: ['Python'],
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'hashed',
        skillsHave: ['Java'],
        skillsWant: ['C++'],
      });

      const suggestions = await getUserSuggestions(user1._id);

      expect(suggestions).toHaveLength(0);
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(getUserSuggestions(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('sendConnectionRequest', () => {
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

      const result = await sendConnectionRequest(sender._id, receiver._id);

      expect(result.message).toBe('Connection request sent');

      const request = await ConnectionRequest.findOne({
        senderId: sender._id,
        receiverId: receiver._id,
      });
      expect(request).toBeDefined();
      expect(request.status).toBe('pending');
    });

    it('should throw error if sender has no free connections left', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
        freeConnectionLeft: 0,
      });

      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
      });

      await expect(
        sendConnectionRequest(sender._id, receiver._id)
      ).rejects.toThrow('Free tier used. Purchase a plan to continue');
    });

    it('should throw error if request already exists', async () => {
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

      await ConnectionRequest.create({
        senderId: sender._id,
        receiverId: receiver._id,
        status: 'pending',
      });

      await expect(
        sendConnectionRequest(sender._id, receiver._id)
      ).rejects.toThrow('Connection request already sent');
    });

    it('should throw error if sender not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
      });

      await expect(
        sendConnectionRequest(fakeId, receiver._id)
      ).rejects.toThrow('Sender not found');
    });

    it('should throw error if receiver not found', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
        freeConnectionLeft: 5,
      });

      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        sendConnectionRequest(sender._id, fakeId)
      ).rejects.toThrow('Receiver not found');
    });
  });

  describe('acceptConnectionRequest', () => {
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

      const result = await acceptConnectionRequest(sender._id, receiver._id);

      expect(result.message).toBe('Connection request accepted');

      const request = await ConnectionRequest.findOne({
        senderId: sender._id,
        receiverId: receiver._id,
      });
      expect(request.status).toBe('accepted');

      const updatedSender = await User.findById(sender._id);
      const updatedReceiver = await User.findById(receiver._id);
      expect(updatedSender.freeConnectionLeft).toBe(4);
      expect(updatedReceiver.freeConnectionLeft).toBe(4);
    });

    it('should throw error if request not found', async () => {
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

      await expect(
        acceptConnectionRequest(sender._id, receiver._id)
      ).rejects.toThrow('Request not found');
    });

    it('should throw error if users have no connections left', async () => {
      const sender = await User.create({
        name: 'Sender',
        email: 'sender@example.com',
        password: 'hashed',
        freeConnectionLeft: 0,
      });

      const receiver = await User.create({
        name: 'Receiver',
        email: 'receiver@example.com',
        password: 'hashed',
        freeConnectionLeft: 0,
      });

      await ConnectionRequest.create({
        senderId: sender._id,
        receiverId: receiver._id,
        status: 'pending',
      });

      await expect(
        acceptConnectionRequest(sender._id, receiver._id)
      ).rejects.toThrow('One or both users have no connections left');
    });
  });

  describe('rejectConnectionRequest', () => {
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

      const result = await rejectConnectionRequest(sender._id, receiver._id);

      expect(result.message).toBe('Connection request rejected');

      const request = await ConnectionRequest.findOne({
        senderId: sender._id,
        receiverId: receiver._id,
      });
      expect(request).toBeNull();
    });

    it('should throw error if request not found', async () => {
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

      await expect(
        rejectConnectionRequest(sender._id, receiver._id)
      ).rejects.toThrow('Request not found');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return pending status when user is sender', async () => {
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

      const status = await getConnectionStatus(sender._id, receiver._id);

      expect(status.status).toBe('pending');
    });

    it('should return received status when user is receiver', async () => {
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

      const status = await getConnectionStatus(receiver._id, sender._id);

      expect(status.status).toBe('received');
    });

    it('should throw error if request not found', async () => {
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

      await expect(
        getConnectionStatus(sender._id, receiver._id)
      ).rejects.toThrow('Request not found');
    });
  });

  describe('getUserConnections', () => {
    it('should return accepted connections', async () => {
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

      const user3 = await User.create({
        name: 'User 3',
        email: 'user3@example.com',
        password: 'hashed',
      });

      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user2._id,
        status: 'accepted',
      });

      await ConnectionRequest.create({
        senderId: user1._id,
        receiverId: user3._id,
        status: 'pending',
      });

      const connections = await getUserConnections(user1._id);

      expect(connections).toHaveLength(1);
      expect(connections[0]._id.toString()).toBe(user2._id.toString());
    });

    it('should return empty array when no connections', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'hashed',
      });

      const connections = await getUserConnections(user._id);

      expect(connections).toHaveLength(0);
    });
  });
});

