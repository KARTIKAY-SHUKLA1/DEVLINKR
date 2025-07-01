// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (toEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your DevLinkr OTP Verification Code",
    html: `<h2>🔐 DevLinkr Verification</h2>
           <p>Your OTP is: <strong>${otp}</strong></p>
           <p>This code is valid for 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOTP;
