const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reportController = require('../../../controllers/reportController');
const User = require('../../../models/User');
const Report = require('../../../models/Report');
const bcrypt = require('bcryptjs');

jest.mock('../../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;

describe('Report Controller Unit Tests', () => {
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
    it('should report user successfully', async () => {
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

      const req = {
        user: { _id: reporter._id },
        body: {
          reportedUserId: reported._id,
          reason: 'Inappropriate behavior',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await reportController.reportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Report submitted successfully',
        })
      );
    });

    it('should return 400 if required fields missing', async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: {
          reason: 'Some reason',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await reportController.reportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('hasReportedUser', () => {
    it('should return report status', async () => {
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

      const req = {
        query: { reporterId: reporter._id },
        params: { reportedUserId: reported._id },
      };
      const res = {
        json: jest.fn(),
      };

      await reportController.hasReportedUser(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasReported: true,
        })
      );
    });
  });

  describe('getMyReportStats', () => {
    it('should return report stats', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'hashed',
        isBanned: false,
      });

      await Report.create({
        reporterId: new mongoose.Types.ObjectId(),
        reportedUserId: user._id,
        reason: 'Reason 1',
      });

      const req = {
        user: { _id: user._id },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await reportController.getMyReportStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reportCount: 1,
          isBanned: false,
          maxAllowedBeforeBan: 3,
        })
      );
    });
  });
});

