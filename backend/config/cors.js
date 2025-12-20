const cors = require("cors");
const normalizedOrigins = require("./origin");

module.exports = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 

    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();

    if (normalizedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    if (normalizedOrigin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
});
