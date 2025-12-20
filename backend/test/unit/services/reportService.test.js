const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reportService = require('../../../services/reportService');
const User = require('../../../models/User');
const Report = require('../../../models/Report');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Report Service Unit Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Report.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Report.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('reportUser', () => {
    it('should report a user successfully', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      const result = await reportService.reportUser({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Inappropriate behavior',
      });

      expect(result.message).toBe('Report submitted successfully');

      const report = await Report.findOne({
        reporterId: reporter._id,
        reportedUserId: reported._id,
      });
      expect(report).toBeDefined();
      expect(report.reason).toBe('Inappropriate behavior');
    });

    it('should ban user after 5 reports', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
        isBanned: false,
      });

      // Create 4 existing reports
      for (let i = 0; i < 4; i++) {
        await Report.create({
          reporterId: new mongoose.Types.ObjectId(),
          reportedUserId: reported._id,
          reason: `Reason ${i}`,
        });
      }

      await reportService.reportUser({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Final report',
      });

      const updatedUser = await User.findById(reported._id);
      expect(updatedUser.isBanned).toBe(true);
    });

    it('should throw error if user reports themselves', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'hashed',
      });

      await expect(
        reportService.reportUser({
          reporterId: user._id,
          reportedUserId: user._id,
          reason: 'Some reason',
        })
      ).rejects.toThrow('You cannot report yourself');
    });

    it('should throw error if reporter not found', async () => {
      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        reportService.reportUser({
          reporterId: fakeId,
          reportedUserId: reported._id,
          reason: 'Some reason',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if reported user not found', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        reportService.reportUser({
          reporterId: reporter._id,
          reportedUserId: fakeId,
          reason: 'Some reason',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if already reported', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      await Report.create({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Previous report',
      });

      await expect(
        reportService.reportUser({
          reporterId: reporter._id,
          reportedUserId: reported._id,
          reason: 'New reason',
        })
      ).rejects.toThrow('You have already reported this user');
    });
  });

  describe('hasReportedUser', () => {
    it('should return true if user has reported', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      await Report.create({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Some reason',
      });

      const result = await reportService.hasReportedUser(
        { reporterId: reporter._id },
        reported._id
      );

      expect(result.hasReported).toBe(true);
    });

    it('should return false if user has not reported', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      const result = await reportService.hasReportedUser(
        { reporterId: reporter._id },
        reported._id
      );

      expect(result.hasReported).toBe(false);
    });

    it('should throw error if reporterId missing', async () => {
      const reported = await User.create({
        name: 'Reported',
        email: 'reported@example.com',
        password: 'hashed',
      });

      await expect(
        reportService.hasReportedUser({}, reported._id)
      ).rejects.toThrow('Missing reporter ID');
    });

    it('should throw error if reportedUserId missing', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@example.com',
        password: 'hashed',
      });

      await expect(
        reportService.hasReportedUser({ reporterId: reporter._id }, null)
      ).rejects.toThrow('Missing reported user ID');
    });
  });

  describe('getMyReportStats', () => {
    it('should return report stats for user', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'hashed',
        isBanned: false,
      });

      // Create some reports
      for (let i = 0; i < 2; i++) {
        await Report.create({
          reporterId: new mongoose.Types.ObjectId(),
          reportedUserId: user._id,
          reason: `Reason ${i}`,
        });
      }

      const stats = await reportService.getMyReportStats(user._id);

      expect(stats.reportCount).toBe(2);
      expect(stats.isBanned).toBe(false);
      expect(stats.maxAllowedBeforeBan).toBe(3);
    });

    it('should return banned status correctly', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'hashed',
        isBanned: true,
      });

      const stats = await reportService.getMyReportStats(user._id);

      expect(stats.isBanned).toBe(true);
    });

    it('should throw error if userId missing', async () => {
      await expect(reportService.getMyReportStats(null)).rejects.toThrow('User ID is required');
    });
  });
});

