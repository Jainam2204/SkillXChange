const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

/**
 * Setup MongoDB Memory Server for tests
 */
const setupMongoDB = async () => {
  if (mongoServer) {
    return mongoServer.getUri();
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'test-db',
    },
  });

  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  return mongoUri;
};

/**
 * Cleanup MongoDB connection
 */
const cleanupMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

module.exports = {
  setupMongoDB,
  cleanupMongoDB,
};

