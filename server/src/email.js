const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordReset(toEmail, code) {
  await transporter.sendMail({
    from:    `"Bond" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Your Bond password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a18;color:#fff;border-radius:16px">
        <h2 style="color:#5865f2;margin-top:0">🫂 Reset your Bond password</h2>
        <p style="color:#aaa;margin-bottom:24px">Enter this 6-digit code in the app. It expires in <strong style="color:#fff">15 minutes</strong>.</p>
        <div style="background:#12122a;border:2px solid #5865f240;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#fff;font-family:monospace">${code}</span>
        </div>
        <p style="color:#555;font-size:12px;line-height:1.6">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordReset };
