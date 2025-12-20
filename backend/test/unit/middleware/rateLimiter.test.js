const { apiLimiter, authLimiter, uploadLimiter } = require('../../../middleware/rateLimiter');
const request = require('supertest');
const express = require('express');

describe.skip('Rate Limiter Middleware Unit Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('apiLimiter', () => {
    it('should allow requests within limit', async () => {
      app.get('/test', apiLimiter, (req, res) => {
        res.json({ message: 'Success' });
      });

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '127.0.0.1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Success');
    });

    it('should block requests exceeding limit', async () => {
      app.get('/test', apiLimiter, (req, res) => {
        res.json({ message: 'Success' });
      });

      // Make requests up to the limit (1000 in test env)
      const limit = process.env.NODE_ENV === 'production' ? 100 : 1000;
      
      for (let i = 0; i < limit; i++) {
        await request(app)
          .get('/test')
          .set('X-Forwarded-For', '127.0.0.1');
      }

      // This request should be blocked
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '127.0.0.1');

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many requests');
    });
  });

  describe('authLimiter', () => {
    it('should allow authentication attempts within limit', async () => {
      app.post('/auth', authLimiter, (req, res) => {
        res.json({ message: 'Success' });
      });

      const limit = process.env.NODE_ENV === 'production' ? 15 : 2;
      
      for (let i = 0; i < limit - 1; i++) {
        const response = await request(app)
          .post('/auth')
          .set('X-Forwarded-For', '127.0.0.1')
          .send({ email: 'test@example.com', password: 'wrong' });

        expect(response.status).toBe(200);
      }
    });

    it('should block authentication attempts exceeding limit', async () => {
      app.post('/auth', authLimiter, (req, res) => {
        res.status(401).json({ message: 'Invalid credentials' });
      });

      const limit = process.env.NODE_ENV === 'production' ? 15 : 2;
      
      // Make failed attempts up to the limit
      for (let i = 0; i < limit; i++) {
        await request(app)
          .post('/auth')
          .set('X-Forwarded-For', '127.0.0.1')
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      // This attempt should be blocked
      const response = await request(app)
        .post('/auth')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many authentication attempts');
    });
  });

  describe('uploadLimiter', () => {
    it('should allow uploads within limit', async () => {
      app.post('/upload', uploadLimiter, (req, res) => {
        res.json({ message: 'Upload successful' });
      });

      const response = await request(app)
        .post('/upload')
        .set('X-Forwarded-For', '127.0.0.1');

      expect(response.status).toBe(200);
    });
  });
});

