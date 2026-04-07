const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, studentName, otp) {
  await transporter.sendMail({
    from: `"HostelMS Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Device Reset OTP — HostelMS',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1d4ed8;margin-bottom:8px">HostelMS — Device Reset</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your admin has initiated a device reset for your account. Use the OTP below to verify and bind your new device:</p>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0369a1">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#6b7280;font-size:13px">If you did not request this, contact your hostel admin immediately.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };

// ── Notification email (important alerts only) ────────────────────────────────
// type: 'warning' | 'success' | 'info'  — only 'warning' triggers email by default
const TYPE_COLOR = {
  warning: '#d97706',
  success: '#16a34a',
  info:    '#2563eb',
};

async function sendNotificationEmail(toEmail, recipientName, { title, message, actionUrl, type = 'info' }) {
  const color = TYPE_COLOR[type] || TYPE_COLOR.info;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const fullUrl = actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`;

  await transporter.sendMail({
    from: `"HostelMS Alerts" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${title} — HostelMS`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:${color};margin-bottom:4px">HostelMS Notification</h2>
        <p style="color:#6b7280;font-size:13px;margin-top:0">Hostel Management System</p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:16px 0"/>
        <p>Hi <strong>${recipientName}</strong>,</p>
        <div style="background:#f9fafb;border-left:4px solid ${color};border-radius:6px;padding:16px;margin:16px 0">
          <p style="font-weight:600;color:#111827;margin:0 0 6px">${title}</p>
          <p style="color:#374151;margin:0;font-size:14px">${message}</p>
        </div>
        <a href="${fullUrl}"
           style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px">
          View in App
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:20px">
          You received this because you are registered on HostelMS.<br/>
          Do not reply to this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail, sendNotificationEmail };
