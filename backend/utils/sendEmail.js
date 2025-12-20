const apiInstance = require("../config/emailConfig");
const logger = require("../utils/logger");
const { getHtmlForEmail } = require("../templates/emailStrategies");

const sendEmail = async (
  to,
  subject,
  text,
  html = null,
  senderName = "Team SkillXChange"
) => {

  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new Error(`Invalid email address: ${to}`);
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  const htmlContent = getHtmlForEmail({ text, html });

  const sendSmtpEmail = {
    sender: {
      name: senderName,
      email: process.env.EMAIL_FROM,
    },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`Email sent successfully to ${to}`, {
      messageId: response?.messageId,
    });
    return response;
  } catch (error) {
    logger.error("Error sending email via Brevo", { error });

    const status = error.status || error.response?.status;

    if (status === 401) {
      throw new Error(
        "Authentication failed. Please check your BREVO_API_KEY in environment variables."
      );
    } else if (status === 400) {
      throw new Error(
        `Bad request: ${error.message}. Check sender email is verified in Brevo.`
      );
    } else if (status === 402) {
      throw new Error(
        "Account credits exhausted. Please add credits to your Brevo account."
      );
    } else if (status === 404) {
      throw new Error(
        "Brevo API endpoint not found. Check API version compatibility."
      );
    } else if (error.response && error.response.body) {
      throw new Error(
        `Brevo API error: ${JSON.stringify(error.response.body)}`
      );
    } else {
      throw new Error(
        `Failed to send email: ${error.message || "Unknown error"}`
      );
    }
  }
};

module.exports = sendEmail;
