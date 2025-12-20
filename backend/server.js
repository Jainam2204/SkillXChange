const dotenv = require("dotenv");
const { createServer } = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const validateEnv = require("./utils/validateEnv");
const connectDB = require("./config/db");
const app = require("./app");
const { initRealtime } = require("./services/realtime");

const { initializeSocket } = require("./socket");

const messageController = require("./controllers/messageController");

dotenv.config();

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

try {
  validateEnv();
} catch (error) {
  logger.error(`Environment validation failed: ${error.message}`);
  process.exit(1);
}

connectDB();

const server = createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initRealtime(io);

initializeSocket(io);

messageController.initMessageController(io);



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});