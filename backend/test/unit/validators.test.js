const { useValidation } = require('../../utils/validators');
const { validationResult } = require('express-validator');

describe('Validators Unit Tests', () => {
  describe('Password Validation', () => {
    const registerValidators = useValidation('register');
    
    it('should accept valid password with all requirements', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject password without uppercase', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Password must be 6-14 chars');
    });

    it('should reject password without lowercase', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'PASSWORD123!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });

    it('should reject password without digit', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password!',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });

    it('should reject password without special character', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });

    it('should reject password shorter than 6 characters', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Pa1!', // length 4
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });

    it('should reject password longer than 14 characters', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!@#',
          skillsHave: ['JavaScript'],
          skillsWant: ['React'],
        },
      };
      const res = {};
      
      for (const validator of registerValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('Verification Code Validation', () => {
    const verificationValidators = useValidation('verification');
    
    it('should accept valid 6-digit code', async () => {
      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          verificationCode: '123456',
        },
      };
      const res = {};
      
      for (const validator of verificationValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject code with letters', async () => {
      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          verificationCode: '12345a',
        },
      };
      const res = {};
      
      for (const validator of verificationValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('only digits');
    });

    it('should reject code shorter than 6 digits', async () => {
      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          verificationCode: '12345',
        },
      };
      const res = {};
      
      for (const validator of verificationValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('exactly 6 digits');
    });

    it('should reject code longer than 6 digits', async () => {
      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          verificationCode: '1234567',
        },
      };
      const res = {};
      
      for (const validator of verificationValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });

    it('should reject empty verification code', async () => {
      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          verificationCode: '',
        },
      };
      const res = {};
      
      for (const validator of verificationValidators.slice(0, -1)) {
        await validator(req, res, () => {});
      }
      
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
    });
  });
});

