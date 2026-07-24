import nodemailer from 'nodemailer';
import { db } from '../database/db.js';

// Get sender email from settings or default
const getSenderEmail = async () => {
  try {
    const s = await db.findOne('settings', { key: 'systemEmail' });
    if (s && s.value) return s.value;
  } catch (err) {
    // fallback
  }
  return process.env.SENDER_EMAIL || 'vdpersonal13@gmail.com';
};

// Create Nodemailer Transporter
const createTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || 'vdpersonal13@gmail.com';
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  // Fallback Ethereal/Test Transporter or Json Transporter
  return nodemailer.createTransport({
    jsonTransport: true
  });
};

/**
 * Send Email Notification to Host Employee when a Visitor Registers for Approval
 */
export const sendHostApprovalNotification = async ({
  hostEmail,
  hostName,
  visitorName,
  visitorCompany,
  visitorPhone,
  scheduledDate,
  scheduledTime,
  purpose,
  visitId,
  orgName = 'Acme Corporation'
}) => {
  if (!hostEmail) {
    console.log(`[MAILER] No email registered for host ${hostName}. Notification skipped.`);
    return;
  }

  const senderEmail = await getSenderEmail();
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${orgName} VMS" <${senderEmail}>`,
    to: hostEmail,
    subject: `[VMS Action Required] New Visit Approval Request - ${visitorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111827; color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #374151;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0;">${orgName} Visitor Management System</h2>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 4px;">Approval Request Notification</p>
        </div>

        <div style="background-color: #1f2937; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #f3f4f6; margin-top: 0;">Hello ${hostName},</h3>
          <p style="color: #d1d5db; line-height: 1.5;">
            A visitor has registered a new visit request and is waiting for your approval.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; color: #e5e7eb; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #9ca3af;">Visitor Name:</td><td style="font-weight: bold;">${visitorName}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Company:</td><td>${visitorCompany || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Phone Number:</td><td>${visitorPhone}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Scheduled Date:</td><td>${scheduledDate} ${scheduledTime ? 'at ' + scheduledTime : ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Purpose of Visit:</td><td>${purpose}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://vms-project.vercel.app/login" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Review & Approve Request
          </a>
        </div>

        <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px;">
          Sent automatically by ${orgName} VMS via ${senderEmail}
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER SUCCESS] Host approval email queued/sent to ${hostEmail}:`, info.messageId || 'Success');
  } catch (err) {
    console.error(`[MAILER ERROR] Failed to send email to host ${hostEmail}:`, err.message);
  }
};

/**
 * Send Email Notification to Visitor when Visit is Approved
 */
export const sendVisitorApprovalNotification = async ({
  visitorEmail,
  visitorName,
  hostName,
  scheduledDate,
  scheduledTime,
  purpose,
  visitId,
  visitorPhone,
  meetingRoomName = 'Host Desk',
  orgName = 'Acme Corporation'
}) => {
  if (!visitorEmail) {
    console.log(`[MAILER] No registered email for visitor ${visitorName}. Skipping email notification.`);
    return;
  }

  const senderEmail = await getSenderEmail();
  const transporter = createTransporter();
  const passUrl = `https://vms-project.vercel.app/pass?visitId=${visitId}`;
  const statusUrl = `https://vms-project.vercel.app/status?phone=${encodeURIComponent(visitorPhone)}`;

  const mailOptions = {
    from: `"${orgName} VMS" <${senderEmail}>`,
    to: visitorEmail,
    subject: `[APPROVED] Your Visit Pass for ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin: 0;">Visit Request Approved ✓</h2>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 4px;">${orgName} Entry Pass Notification</p>
        </div>

        <div style="background-color: #111827; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <h3 style="color: #ffffff; margin-top: 0;">Dear ${visitorName},</h3>
          <p style="color: #d1d5db; line-height: 1.5;">
            Great news! Your visit request to <strong>${orgName}</strong> has been confirmed and approved by your host.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 14px; color: #e5e7eb; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #9ca3af;">Host Employee:</td><td style="font-weight: bold; color: #60a5fa;">${hostName}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Allocated Room:</td><td style="font-weight: bold; color: #10b981;">${meetingRoomName}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Scheduled Date:</td><td>${scheduledDate} ${scheduledTime ? 'at ' + scheduledTime : ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Purpose of Visit:</td><td>${purpose}</td></tr>
            <tr><td style="padding: 6px 0; color: #9ca3af;">Visit ID:</td><td style="font-family: monospace; color: #a7f3d0;">${visitId}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${passUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            View & Download Visitor Entry Pass
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-bottom: 20px;">
          You can also check your live status anytime using your registered phone number (${visitorPhone}) at: <br/>
          <a href="${statusUrl}" style="color: #3b82f6;">${statusUrl}</a>
        </p>

        <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />

        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          Please show your QR pass or phone number to the security desk upon arrival.<br/>
          Official notification sent by ${orgName} via ${senderEmail}
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER SUCCESS] Visitor approval pass email sent to ${visitorEmail}:`, info.messageId || 'Success');
  } catch (err) {
    console.error(`[MAILER ERROR] Failed to send approval email to visitor ${visitorEmail}:`, err.message);
  }
};
