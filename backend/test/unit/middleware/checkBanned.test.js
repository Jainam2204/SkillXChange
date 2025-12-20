const checkBanned = require('../../../middleware/checkBanned');

describe('CheckBanned Middleware Unit Tests', () => {
  it('should call next() when user is not banned', () => {
    const req = {
      user: {
        _id: '123',
        name: 'Test User',
        isBanned: false,
      },
    };
    const res = {};
    const next = jest.fn();

    checkBanned(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when user is banned', () => {
    const req = {
      user: {
        _id: '123',
        name: 'Test User',
        isBanned: true,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    checkBanned(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      code: 'USER_BANNED',
      message: 'Your account has been banned. Please use a different account.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when user is undefined', () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    checkBanned(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() when user.isBanned is undefined', () => {
    const req = {
      user: {
        _id: '123',
        name: 'Test User',
      },
    };
    const res = {};
    const next = jest.fn();

    checkBanned(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

