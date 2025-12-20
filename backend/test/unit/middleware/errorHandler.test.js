const errorHandler = require('../../../middleware/errorhandler');

describe('Error Handler Middleware Unit Tests', () => {
  it('should handle error and return error response', () => {
    const err = new Error('Test error');
    err.status = 400;

    const req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        origin: 'http://localhost:3000',
      },
    };

    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
      })
    );
  });

  it('should set CORS headers for allowed origin', () => {
    const err = new Error('Test error');
    const req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        origin: 'http://localhost:5173',
      },
    };

    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5173');
  });

  it('should return 500 for errors without status', () => {
    const err = new Error('Internal server error');
    const req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {},
    };

    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Test error');
    const req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {},
    };

    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });
});

