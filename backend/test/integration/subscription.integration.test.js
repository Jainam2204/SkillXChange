require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock sendEmail to prevent actual email sending during tests
jest.mock('../../utils/sendEmail', () => {
  return jest.fn().mockResolvedValue(true);
});

// Mock Razorpay to prevent actual payment processing during tests
jest.mock('../../config/razorpay', () => ({
  __esModule: true,
  default: {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 9900,
        currency: 'INR',
        status: 'created',
      }),
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        status: 'authorized',
      }),
    },
  },
}));

let mongoServer;

describe.skip('Subscription Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      isVerified: true,
    });

    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(async () => {
    await Subscription.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('POST /subscription/create-order', () => {
    it('should create order successfully', async () => {
      const response = await request(app)
        .post('/subscription/create-order')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          planName: 'Basic',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('amount');
    });

    it('should return 400 when planName is missing', async () => {
      const response = await request(app)
        .post('/subscription/create-order')
        .set('Cookie', `authToken=${authToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Plan name is required');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/subscription/create-order')
        .send({
          planName: 'Basic',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /subscription/verify-payment', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/subscription/verify-payment')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          userId: testUser._id.toString(),
          planName: 'Basic',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required payment details');
    });

    it('should return 403 when userId does not match authenticated user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/subscription/verify-payment')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          userId: fakeUserId.toString(),
          planName: 'Basic',
          orderId: 'order_123',
          paymentId: 'pay_123',
          signature: 'signature_123',
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/subscription/verify-payment')
        .send({
          userId: testUser._id.toString(),
          planName: 'Basic',
          orderId: 'order_123',
          paymentId: 'pay_123',
          signature: 'signature_123',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /subscription/status/:userId', () => {
    it('should return subscription status successfully', async () => {
      const subscription = await Subscription.create({
        userId: testUser._id,
        planName: 'Basic',
        price: 99,
        connectionsAllowed: 5,
        connectionsLeft: 3,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentId: 'pay_123',
        status: 'active',
      });

      const response = await request(app)
        .get(`/subscription/status/${testUser._id}`)
        .set('Cookie', `authToken=${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('subscription');
      expect(response.body.subscription).toBeTruthy();
    });

    it('should return 403 when userId does not match authenticated user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/subscription/status/${fakeUserId}`)
        .set('Cookie', `authToken=${authToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get(`/subscription/status/${testUser._id}`);

      expect(response.statusCode).toBe(401);
    });
  });
});

