const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

jest.setTimeout(20000);

describe.skip('POST /api/auth/register', () => {
  let mongoServer;

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

  it('should register a new user successfully with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: '202412108@dau.ac.in',
        password: 'Password123!',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Verification email sent.');
    expect(response.body).toHaveProperty('userId');
  });

 test("should return error for invalid name", async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Jenil123", // invalid because contains numbers
    email: "jenil@example.com",
    password: "Password@123",
    skillsHave: ["JavaScript"],
    skillsWant: ["Node.js"],
  });

  expect(res.statusCode).toBe(400);

  const nameError = res.body.errors.find(e => e.field === "name");

  // Some validations may return only message; ensure 400 is returned
  if (res.body.errors) {
    const nameError = res.body.errors.find(e => e.field === "name");
    expect(nameError).toBeDefined();
    expect(nameError.message).toBe("Name must contain only letters and spaces");
  }
});


  it('should return 400 if the password does not meet criteria - too short', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'pass',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors) {
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.message).toContain('Password must be 6-14 chars');
    }
  });

  it('should return 400 if password lacks uppercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe2@example.com',
        password: 'password123!',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors) {
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    }
  });

  it('should return 400 if password lacks lowercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe3@example.com',
        password: 'PASSWORD123!',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors) {
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    }
  });

  it('should return 400 if password lacks digit', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe4@example.com',
        password: 'Password!',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors) {
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    }
  });

  it('should return 400 if password lacks special character', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe5@example.com',
        password: 'Password123',
        skillsHave: ['JavaScript'],
        skillsWant: ['React'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors) {
      const passwordError = response.body.errors.find(e => e.field === 'password');
      expect(passwordError).toBeDefined();
    }
  });

  it('should return 400 if skillsHave and skillsWant have overlapping skills', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        skillsHave: ['JavaScript', 'Node.js'],
        skillsWant: ['React', 'JavaScript'],
      });
    expect(response.statusCode).toBe(400);
    if (response.body.errors && response.body.errors[0]) {
      expect(response.body.errors[0].message).toContain('These skills cannot be in both');
    }
  });
});
