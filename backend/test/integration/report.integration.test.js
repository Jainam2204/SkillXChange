require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Report = require('../../models/Report');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

let mongoServer;
let reporter, reported;
let reporterToken;
let hashedPassword;

describe.skip('Report Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    hashedPassword = await bcrypt.hash('Password123!', 10);
    
    reporter = await User.create({
      name: 'Reporter',
      email: 'reporter@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    reported = await User.create({
      name: 'Reported',
      email: 'reported@example.com',
      password: hashedPassword,
      isVerified: true,
      isBanned: false,
    });

    reporterToken = jwt.sign({ userId: reporter._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
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

  describe('POST /report', () => {
    it('should report a user successfully', async () => {
      const response = await request(app)
        .post('/api/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reportedUserId: reported._id,
          reason: 'Inappropriate behavior',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Report submitted successfully');

      const report = await Report.findOne({
        reporterId: reporter._id,
        reportedUserId: reported._id,
      });
      expect(report).toBeDefined();
      expect(report.reason).toBe('Inappropriate behavior');
    });

    it('should return 400 if reportedUserId missing', async () => {
      const response = await request(app)
        .post('/api/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reason: 'Some reason',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 if reason missing', async () => {
      const response = await request(app)
        .post('/api/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reportedUserId: reported._id,
        });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if user tries to report themselves', async () => {
      const response = await request(app)
        .post('/api/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reportedUserId: reporter._id,
          reason: 'Some reason',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('cannot report yourself');
    });

    it('should return 400 if already reported', async () => {
      await Report.create({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Previous report',
      });

      const response = await request(app)
        .post('/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reportedUserId: reported._id,
          reason: 'New reason',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('already reported');
    });

    it('should ban user after 5 reports', async () => {
      const reportedUser = await User.create({
        name: 'To Be Banned',
        email: 'tobebanned@example.com',
        password: hashedPassword,
        isVerified: true,
        isBanned: false,
      });

      // Create 4 existing reports
      for (let i = 0; i < 4; i++) {
        await Report.create({
          reporterId: new mongoose.Types.ObjectId(),
          reportedUserId: reportedUser._id,
          reason: `Reason ${i}`,
        });
      }

      const response = await request(app)
        .post('/report')
        .set('Cookie', `authToken=${reporterToken}`)
        .send({
          reportedUserId: reportedUser._id,
          reason: 'Final report',
        });

      expect(response.statusCode).toBe(200);

      const updatedUser = await User.findById(reportedUser._id);
      expect(updatedUser.isBanned).toBe(true);
    });
  });

  describe('GET /report/has-reported/:reportedUserId', () => {
    it('should return true if user has reported', async () => {
      await Report.create({
        reporterId: reporter._id,
        reportedUserId: reported._id,
        reason: 'Some reason',
      });

      const response = await request(app)
        .get(`/api/report/has-reported/${reported._id}`)
        .set('Cookie', `authToken=${reporterToken}`)
        .query({
          reporterId: reporter._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.hasReported).toBe(true);
    });

    it('should return false if user has not reported', async () => {
      const response = await request(app)
        .get(`/api/report/has-reported/${reported._id}`)
        .set('Cookie', `authToken=${reporterToken}`)
        .query({
          reporterId: reporter._id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.hasReported).toBe(false);
    });
  });

  describe('GET /report/my-stats', () => {
    it('should return report stats for authenticated user', async () => {
      // Create some reports
      for (let i = 0; i < 2; i++) {
        await Report.create({
          reporterId: new mongoose.Types.ObjectId(),
          reportedUserId: reporter._id,
          reason: `Reason ${i}`,
        });
      }

      const response = await request(app)
        .get('/api/report/my-stats')
        .set('Cookie', `authToken=${reporterToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.reportCount).toBe(2);
      expect(response.body.isBanned).toBe(false);
      expect(response.body.maxAllowedBeforeBan).toBe(3);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/report/my-stats');

      expect(response.statusCode).toBe(401);
    });
  });
});

