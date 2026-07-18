import "server-only";
import { headers } from "next/headers";
import nodemailer, { type Transporter } from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedTransport: Transporter | null = null;

/**
 * Build (once) an SMTP transport from env, or return `null` when SMTP isn't
 * configured — in which case callers fall back to logging the message.
 *
 * Env: SMTP_HOST (required to enable real sending), SMTP_PORT (default 587),
 * SMTP_USER / SMTP_PASS (optional), SMTP_SECURE ("true" for implicit TLS).
 */
function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return cachedTransport;
}

const FROM = process.env.MAIL_FROM || "Muse <no-reply@modelhub.test>";

/**
 * Send an email. With SMTP configured (`SMTP_HOST` set) a real message is
 * dispatched; otherwise — local dev — the message and any links are logged to
 * the server console so the flow is fully testable offline.
 */
export async function sendMail({ to, subject, html, text }: MailInput): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.info(
      `\n────────────────────────────────────────────────────────\n` +
        `[mailer] SMTP not configured — logging email instead of sending:\n` +
        `  To:      ${to}\n` +
        `  Subject: ${subject}\n\n  ` +
        text.replace(/\n/g, "\n  ") +
        `\n────────────────────────────────────────────────────────\n`,
    );
    return;
  }
  await transport.sendMail({ from: FROM, to, subject, html, text });
}

/** Compose and send the password-reset email for a given absolute reset URL. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Reset your Muse password";
  const text =
    `We received a request to reset the password for your Muse account.\n\n` +
    `Reset your password using the link below (valid for 1 hour):\n` +
    `${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email — your ` +
    `password won't change.`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
    <h1 style="font-size:20px;margin:0 0 16px">Reset your password</h1>
    <p style="font-size:14px;line-height:1.6;color:#444">
      We received a request to reset the password for your Muse account.
    </p>
    <p style="margin:24px 0">
      <a href="${resetUrl}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600">
        Reset password
      </a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#666">
      This link is valid for 1 hour. If you didn't request this, you can safely
      ignore this email — your password won't change.
    </p>
    <p style="font-size:12px;color:#999;word-break:break-all;margin-top:24px">
      Or paste this link into your browser:<br />${resetUrl}
    </p>
  </div>`;
  await sendMail({ to, subject, html, text });
}

/**
 * Absolute base URL for building links in emails. Prefers `APP_URL`; otherwise
 * derives it from the incoming request headers (works in local dev).
 */
export async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (envUrl) return envUrl;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}
