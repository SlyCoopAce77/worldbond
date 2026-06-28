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
    from:    `"WorldBond" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Your WorldBond password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#000000;color:#fff;border-radius:16px">
        <h2 style="color:#FF0080;margin-top:0;font-size:22px;letter-spacing:-0.5px">WorldBond</h2>
        <h3 style="color:#fff;margin-top:0">Reset your password</h3>
        <p style="color:#888;margin-bottom:24px">Enter this 6-digit code in the app. It expires in <strong style="color:#fff">15 minutes</strong>.</p>
        <div style="background:#111;border:2px solid #FF008040;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#FF0080;font-family:monospace">${code}</span>
        </div>
        <p style="color:#444;font-size:12px;line-height:1.6">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
        <p style="color:#333;font-size:11px;margin-top:24px">WorldBond — Connect the world</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordReset };
