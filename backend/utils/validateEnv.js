const Joi = require("joi");
const logger = require("./logger");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number()
    .port()
    .default(3000),

  MONGODB_URI: Joi.string()
    .required()
    .description("MongoDB connection URI"),

  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description("JWT secret key (minimum 32 characters)"),

  CLIENT_URL: Joi.string()
    .uri()
    .required()
    .description("Primary frontend client URL"),
  FRONTEND_URL: Joi.string()
    .uri()
    .optional()
    .description("Alternative frontend URL"),
  FILE_BASE_URL: Joi.string()
    .uri()
    .optional()
    .description("Base URL for file serving (e.g. CDN)"),

  CLOUDINARY_CLOUD_NAME: Joi.string()
    .optional()
    .allow("")
    .description("Cloudinary cloud name"),
  CLOUDINARY_API_KEY: Joi.string()
    .optional()
    .allow("")
    .description("Cloudinary API key"),
  CLOUDINARY_SECRET_KEY: Joi.string()
    .optional()
    .allow("")
    .description("Cloudinary secret key"),
  CLOUDINARY_FOLDER: Joi.string()
    .optional()
    .default("chat_uploads")
    .description("Default Cloudinary folder"),

  RAZORPAY_KEY_ID: Joi.string()
    .optional()
    .allow("")
    .description("Razorpay key ID"),
  RAZORPAY_KEY_SECRET: Joi.string()
    .optional()
    .allow("")
    .description("Razorpay key secret"),
  RAZORPAY_CURRENCY: Joi.string()
    .optional()
    .default("INR")
    .description("Razorpay currency"),
  INR_TO_USD_RATE: Joi.number()
    .optional()
    .default(82)
    .description("INR to USD conversion rate"),

  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .optional()
    .default("info")
    .description("Logging level"),

  EMAIL_HOST: Joi.string()
    .required()
    .description("SMTP server host (e.g., smtp-relay.brevo.com)"),
  EMAIL_PORT: Joi.number()
    .port()
    .required()
    .description("SMTP server port (587 for STARTTLS, 465 for SSL)"),
  EMAIL_USER: Joi.string()
    .required()
    .description("SMTP authentication username (your Brevo SMTP login)"),
  EMAIL_PASS: Joi.string()
    .required()
    .description("SMTP authentication password (your Brevo SMTP key)"),
  EMAIL_FROM: Joi.string()
    .email()
    .required()
    .description("Email sender address (must be verified in Brevo)"),
}).unknown(true); 

const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false, 
    stripUnknown: false,
    convert: true, 
  });

  if (error) {
    const errorMessages = error.details
      .map((detail) => detail.message)
      .join(", ");
    logger.error(`Environment validation error: ${errorMessages}`);
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  
  process.env.NODE_ENV = value.NODE_ENV;
  process.env.PORT = String(value.PORT);

  logger.info("Environment variables validated successfully");
  return value; 
};

module.exports = validateEnv;
