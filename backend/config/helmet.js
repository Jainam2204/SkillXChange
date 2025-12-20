const helmet = require("helmet");

module.exports = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      fontSrc: ["'self'", "data:"],
    },
  },
});
