const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logger");

dotenv.config();

let isConnected = false;
let listenersAttached = false;

const attachConnectionListeners = () => {
  if (listenersAttached) return;

  const conn = mongoose.connection;

  conn.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
  });

  conn.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
    isConnected = false;
  });

  conn.on("reconnected", () => {
    logger.info("MongoDB reconnected");
    isConnected = true;
  });

  process.once("SIGINT", async () => {
    try {
      await conn.close();
      logger.info("MongoDB connection closed through app termination");
    } catch (err) {
      logger.error("Error while closing MongoDB connection:", err);
    } finally {
      process.exit(0);
    }
  });

  listenersAttached = true;
};

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      logger.error("MONGODB_URI is not defined in environment variables");
      process.exit(1);
    }

    if (isConnected) {
      return mongoose.connection;
    }

    const options = {
      maxPoolSize:
        process.env.NODE_ENV === "production" ? 10 : 5,
      minPoolSize:
        process.env.NODE_ENV === "production" ? 5 : 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    isConnected = true;

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    attachConnectionListeners();

    return conn;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
