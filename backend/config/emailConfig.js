const { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } = require('@getbrevo/brevo');
const dotenv = require("dotenv");
const logger = require("../utils/logger");

dotenv.config();

if (!process.env.BREVO_API_KEY) {
  throw new Error("Missing required environment variable: BREVO_API_KEY");
}

if (!process.env.EMAIL_FROM) {
  throw new Error("Missing required environment variable: EMAIL_FROM");
}

const apiInstance = new TransactionalEmailsApi();

apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

logger.info("Brevo API initialized successfully");
logger.info(`Default sender: ${process.env.EMAIL_FROM}`);

module.exports = apiInstance;
