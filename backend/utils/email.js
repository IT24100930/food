const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"Smart Food 🍽️" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify your Smart Food account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🍽️ Smart Food</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#333;">Hello, ${name}! 👋</h2>
          <p style="color:#666;line-height:1.6;">Welcome to Smart Food! Please verify your email address to get started.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#FF6B35;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email Address</a>
          <p style="color:#999;font-size:14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset your Smart Food password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🍽️ Smart Food</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#333;">Password Reset Request</h2>
          <p style="color:#666;line-height:1.6;">Hi ${name}, we received a request to reset your password.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#FF6B35;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
          <p style="color:#999;font-size:14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  }),

  invoice: (name, invoiceNumber, orderDetails, totalAmount, currency, pdfUrl) => ({
    subject: `Invoice ${invoiceNumber} - Smart Food`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🍽️ Smart Food</h1>
          <p style="color:#fff;margin:8px 0 0;">Invoice</p>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#333;">Thank you, ${name}!</h2>
          <p style="color:#666;">Invoice #: <strong>${invoiceNumber}</strong></p>
          <p style="color:#666;">Total: <strong>${currency} ${totalAmount}</strong></p>
          <p style="color:#666;">Your order is confirmed and your invoice is ready.</p>
          ${pdfUrl ? `<a href="${pdfUrl}" style="display:inline-block;background:#FF6B35;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">Download Invoice PDF</a>` : ''}
        </div>
      </div>
    `
  }),

  refundProcessed: (name, refundNumber, amount, currency) => ({
    subject: `Refund Processed - ${refundNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#27ae60,#2ecc71);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🍽️ Smart Food</h1>
          <p style="color:#fff;margin:8px 0 0;">Refund Processed</p>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#333;">Refund Confirmed ✅</h2>
          <p style="color:#666;">Hi ${name}, your refund has been processed successfully.</p>
          <p style="color:#666;">Refund #: <strong>${refundNumber}</strong></p>
          <p style="color:#666;">Amount: <strong>${currency} ${amount}</strong></p>
          <p style="color:#999;font-size:14px;">Please allow 3-5 business days for the amount to appear in your account.</p>
        </div>
      </div>
    `
  }),
};

module.exports = { sendEmail, emailTemplates };
