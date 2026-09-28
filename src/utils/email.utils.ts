import nodemailer from 'nodemailer';
import path from 'path';
import { config } from '../config/env';

// Logo path
const LOGO_PATH = path.resolve(__dirname, '../../assets/logo.png');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: false,
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

/**
 * Send OTP verification email with branded design + inline logo
 */
export const sendOtpEmail = async (to: string, otp: string, name: string): Promise<void> => {
  const otpDigits = otp.split('').join('</td><td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">');

  const mailOptions = {
    from: config.emailFrom,
    to,
    subject: '🔐 HealthConnect – Verify Your Email',
    // Inline attachment: referenced via cid:logo in the HTML
    attachments: [
      {
        filename: 'logo.png',
        path: LOGO_PATH,
        cid: 'healthconnect-logo', // same cid used in <img src="cid:...">
      },
    ],
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Verification – HealthConnect</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2ff;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(37,99,235,0.10);max-width:560px;width:100%;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:36px 40px 28px;text-align:center;">
              <!-- Logo -->
              <img src="cid:healthconnect-logo"
                   alt="HealthConnect"
                   width="140"
                   style="display:block;margin:0 auto 16px;max-height:64px;object-fit:contain;filter:brightness(0) invert(1);" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Email Verification</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Verify your account to get started</p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e293b;">Hi, ${name}! 👋</p>
              <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.7;">
                Thanks for signing up with <strong style="color:#2563eb;">HealthConnect</strong>. 
                Use the one-time password (OTP) below to verify your email address and complete your registration.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#f0f7ff,#eff6ff);border:1.5px solid #bfdbfe;border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Your One-Time Password</p>

                <!-- OTP digits as table cells -->
                <table align="center" cellpadding="0" cellspacing="8" style="margin:0 auto;">
                  <tr>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[0]}</td>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[1]}</td>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[2]}</td>
                    <td style="width:16px;"></td>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[3]}</td>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[4]}</td>
                    <td style="width:48px;height:56px;background:#f0f7ff;border:2px solid #dbeafe;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#1d4ed8;font-family:monospace;">${otp[5]}</td>
                  </tr>
                </table>

                <!-- Timer badge -->
                <p style="margin:18px 0 0;">
                  <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;border:1px solid #fde68a;">
                    ⏱ Expires in ${config.otpExpiresMinutes} minutes
                  </span>
                </p>
              </div>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 10px 10px 0;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⚠️ <strong>Never share this OTP</strong> with anyone. HealthConnect will 
                      never ask for your OTP via phone or email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Ignore notice -->
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7;text-align:center;">
                If you didn't create a HealthConnect account, you can safely ignore this email.<br/>
                Your account security is our top priority. 🔒
              </p>

            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e2e8f0;"></div>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} <strong style="color:#2563eb;">HealthConnect</strong>. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                This is an automated message — please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
