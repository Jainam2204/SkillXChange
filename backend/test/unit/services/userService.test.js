const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { getProfile, getUserById, updateUserProfile } = require('../../../services/userService');
const User = require('../../../models/User');

let mongoServer;

describe.skip('User Service Unit Tests', () => {
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

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });

      const profile = await getProfile(user._id);

      expect(profile).toBeDefined();
      expect(profile.name).toBe('Test User');
      expect(profile.email).toBe('test@example.com');
      expect(profile.password).toBeUndefined();
      expect(profile.skillsHave).toEqual(['JavaScript']);
      expect(profile.skillsWant).toEqual(['React']);
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(getProfile(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserById', () => {
    it('should return user by id without password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      const foundUser = await getUserById(user._id);

      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe('Test User');
      expect(foundUser.password).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(getUserById(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });

      const updates = {
        name: 'Updated User',
        skillsHave: ['Python', 'Java'],
        skillsWant: ['Django'],
      };

      const updatedUser = await updateUserProfile(user._id, updates);

      expect(updatedUser.name).toBe('Updated User');
      expect(updatedUser.skillsHave).toEqual(['Python', 'Java']);
      expect(updatedUser.skillsWant).toEqual(['Django']);
      expect(updatedUser.email).toBe('test@example.com'); // Should remain unchanged
    });

    it('should throw error if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        updateUserProfile(fakeId, { name: 'New Name' })
      ).rejects.toThrow('User not found');
    });

    it('should update only provided fields', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });

      const updates = {
        name: 'Updated Name',
      };

      const updatedUser = await updateUserProfile(user._id, updates);

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('test@example.com');
      expect(updatedUser.skillsHave).toEqual(['JavaScript']);
    });
  });
});

