const logger = require("../utils/logger");
const normalizedOrigins = require("../config/origin");

module.exports = (err, req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();

    if (
      normalizedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith(".vercel.app")
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cookie"
      );
    }
  }

  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    origin: origin,
  });

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  });
};
