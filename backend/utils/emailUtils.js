const nodemailer = require("nodemailer");

/* ────────────── Transporter ────────────── */

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true", // true → 465 (SSL), false → STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,         // reuse connections
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return _transporter;
};

/* ────────────── Helpers ────────────── */

const FROM = () =>
  `"${process.env.APP_NAME || "CoreInventory"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

/* ────────────── Email Senders ────────────── */

/**
 * Send email-verification OTP.
 * @param {string} to     Recipient email
 * @param {string} otp    Plain-text OTP
 * @param {string} name   Recipient name (for personalisation)
 */
const sendVerificationEmail = async (to, otp, name = "User") => {
  await getTransporter().sendMail({
    from: FROM(),
    to,
    subject: "CoreInventory — Email Verification Code",
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: buildOTPHtml({
      title: "Email Verification",
      greeting: `Hi ${name},`,
      body: "Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.",
      otp,
      footer: "If you did not create a CoreInventory account, you can safely ignore this email.",
    }),
  });
};

/**
 * Send password-reset OTP.
 * @param {string} to     Recipient email
 * @param {string} otp    Plain-text OTP
 * @param {string} name   Recipient name
 */
const sendPasswordResetEmail = async (to, otp, name = "User") => {
  await getTransporter().sendMail({
    from: FROM(),
    to,
    subject: "CoreInventory — Password Reset Code",
    text: `Hi ${name},\n\nYour password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, please secure your account immediately.`,
    html: buildOTPHtml({
      title: "Password Reset",
      greeting: `Hi ${name},`,
      body: "Use the code below to reset your password. It expires in <strong>10 minutes</strong>.",
      otp,
      footer: "If you did not request a password reset, please ignore this email and consider changing your password.",
    }),
  });
};

/* ────────────── HTML Template ────────────── */

const buildOTPHtml = ({ title, greeting, body, otp, footer }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1f2e;padding:28px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">
                🏭 CoreInventory
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#1a1f2e;font-weight:600;">${greeting}</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">${body}</p>
              <!-- OTP Box -->
              <div style="text-align:center;margin:32px 0;">
                <span style="display:inline-block;background:#f0f4ff;border:2px dashed #4f6ef7;
                             border-radius:10px;padding:20px 48px;
                             font-size:36px;font-weight:700;letter-spacing:10px;
                             color:#1a1f2e;font-family:monospace;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0;font-size:13px;color:#718096;line-height:1.5;">${footer}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;text-align:center;
                       border-top:1px solid #edf2f7;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                &copy; ${new Date().getFullYear()} CoreInventory. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
