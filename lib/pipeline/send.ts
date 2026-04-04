/**
 * Phase 4b: Compose and send the outreach email via SMTP
 *
 * Replaces: "Send email" node
 */

import nodemailer from "nodemailer";
import type { OutboundEmail } from "../types";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

/** Build the HTML email body */
export function composeEmail(
  recipientName: string,
  companyReason: string,
  company: string,
  jobTitle: string
): string {
  const greeting = recipientName ? `Hi ${recipientName}` : "Hi there";

  return `<body style="font-family: Arial, Helvetica, sans-serif; color: #000; line-height: 1.5; font-size: 14px;">
  <p>${greeting}, I hope you are doing well.</p>

  <p>A little bit about myself:</p>
  <ul>
    <li>I am Shikhar Gupta, a recent Management grad, ex Product Business Analyst at Digital Harbor and Top PM fellow at Nextleap.</li>
    <li>I have built 3, 0-1 solutions from problem identification and user research to ideation, solution, success metrics and GTM; created vibe-coded prototypes and wireframes.</li>
    <li>I built Zepto's Scheduled Delivery system, forecasting INR 1B+ in cost savings and created documentation.</li>
  </ul>

  <p>Why am I writing to you?</p>
  <p>${companyReason}</p>

  <p>Thank you for considering my application.</p>

  <p style="margin:12px 0 6px 0; font-weight:600;">For your reference</p>
  <p style="margin:6px 0 4px 0;">
    <a href="https://shikharpmg.onhercules.app/" target="_blank" style="color:#0366d6; text-decoration:underline;">Portfolio</a>
    &nbsp;(<span style="color:#555;">Reachable at +91 7987177269</span>)<br>
    <a href="https://www.linkedin.com/in/shikhar-gupta-505b0b21b/" target="_blank" style="color:#0366d6; text-decoration:underline;">LinkedIn</a>
  </p>

  <p>Best regards,<br>Shikhar Gupta</p>
</body>`;
}

/** Send the email via SMTP */
export async function sendOutboundEmail(
  email: OutboundEmail
): Promise<{ messageId: string }> {
  const transport = getTransport();

  const info = await transport.sendMail({
    from: `"Shikhar Gupta" <${process.env.SMTP_USER}>`,
    to: email.to_email,
    subject: email.subject,
    html: email.html_body,
  });

  return { messageId: info.messageId };
}
