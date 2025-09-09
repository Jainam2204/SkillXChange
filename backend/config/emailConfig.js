const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD, 
  },
});