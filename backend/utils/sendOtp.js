const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtp(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "DevLinkr OTP",
    text: `Your OTP for DevLinkr is ${otp}. It expires in 5 minutes.`,
  });
}

module.exports = sendOtp;
