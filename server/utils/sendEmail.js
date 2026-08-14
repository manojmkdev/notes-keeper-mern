const nodemailer = require('nodemailer');

/**
 * Utility to send emails.
 * Uses Resend API if RESEND_API_KEY is defined (bypasses SMTP port blocks).
 * Otherwise falls back to SMTP / Nodemailer.
 */
async function sendEmail({ to, subject, html, text }) {
  const resendKey = process.env.RESEND_API_KEY;

  // Always write to a local file in the project root to make it easy to find during dev/test
  const fs = require('fs');
  const path = require('path');
  try {
    const rootPath = path.join(__dirname, '../../otp.txt');
    fs.writeFileSync(rootPath, `To: ${to}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\n${text}`);
  } catch (writeErr) {
    console.error('Failed to write local otp.txt file:', writeErr.message);
  }

  // 1. Try Resend HTTP API if configured (Highly Recommended for cloud hosting)
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Notes Keeper <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
          text: text,
        }),
      });

      if (response.ok) {
        console.log(`✉️  Email successfully sent to ${to} via Resend API`);
        return;
      } else {
        const errorText = await response.text();
        throw new Error(`Resend API responded with status ${response.status}: ${errorText}`);
      }
    } catch (apiError) {
      console.error(`❌ Resend API failed:`, apiError.message);
      // Fall through to SMTP fallback
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || 'Notes Keeper <noreply@noteskeeper.com>';

  // Fallback to console logging if SMTP is not fully configured
  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log(`✉️  EMAIL SENT TO: ${to}`);
    console.log(`📝 SUBJECT: ${subject}`);
    console.log('--------------------------------------------------');
    console.log(text || html);
    console.log('==================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000, // 10 seconds limit to connect
    greetingTimeout: 10000,   // 10 seconds limit to hand-shake
    socketTimeout: 10000,     // 10 seconds limit for socket activity
  });

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Email successfully sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    // Even if it fails, log the details so the user can verify in development
    console.log('\n==================================================');
    console.log('🚨 FALLBACK - EMAIL CONTENT:');
    console.log(`✉️  TO: ${to}`);
    console.log(`📝 SUBJECT: ${subject}`);
    console.log(text || html);
    console.log('==================================================\n');
  }
}

module.exports = sendEmail;
