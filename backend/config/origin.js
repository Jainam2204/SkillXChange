const logger = require("../utils/logger");

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

const normalizedOrigins = allowedOrigins.map(origin =>
  origin.replace(/\/$/, "").toLowerCase()
);

logger.info(`CORS configuration - Allowed origins: ${normalizedOrigins.join(", ")}`);

module.exports = normalizedOrigins;
