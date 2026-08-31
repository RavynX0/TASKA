const config = require("../config/env");
const AppError = require("./AppError");

// nodemailer is only needed for the raw-SMTP path. Guard the require so the app
// still boots where it isn't installed (e.g. the Brevo-API-only setup).
let nodemailer = null;
try {
  // eslint-disable-next-line global-require
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

let smtpTransport;
function getSmtpTransport() {
  if (smtpTransport !== undefined) return smtpTransport;
  if (nodemailer && config.smtp.host) {
    smtpTransport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  } else {
    smtpTransport = null;
  }
  return smtpTransport;
}

// "Taska <no-reply@taska.app>" -> { name: "Taska", email: "no-reply@taska.app" }
function parseFrom(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value || "");
  if (match) return { name: match[1] || undefined, email: match[2].trim() };
  return { name: undefined, email: (value || "").trim() };
}

// Dev/test convenience only: the last code sent to each address, so the flow
// stays testable without a real inbox. Never populated in production.
const recentCodes = new Map();

function buildEmail(code, expiryMinutes) {
  const subject = `Your ${config.appName} verification code`;
  const text =
    `Your ${config.appName} verification code is ${code}.\n\n` +
    `It expires in ${expiryMinutes} minutes. ` +
    `If you didn't create an account, you can safely ignore this email.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
      <h2 style="margin:0 0 12px">Confirm your email</h2>
      <p style="margin:0 0 16px">Enter this code in ${config.appName} to finish setting up your account:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px">${code}</p>
      <p style="margin:0 0 4px;color:#6b7280;font-size:14px">This code expires in ${expiryMinutes} minutes.</p>
      <p style="margin:0;color:#6b7280;font-size:14px">If you didn't create an account, you can ignore this email.</p>
    </div>`;
  return { subject, text, html };
}

async function sendViaBrevo(to, { subject, text, html }) {
  const sender = parseFrom(config.mailFrom);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.brevoApiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API responded ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp(transport, to, { subject, text, html }) {
  await transport.sendMail({ from: config.mailFrom, to, subject, text, html });
}

async function sendVerificationEmail(to, code, expiryMinutes) {
  const email = buildEmail(code, expiryMinutes);
  const smtp = getSmtpTransport();

  try {
    if (config.brevoApiKey) {
      await sendViaBrevo(to, email);
      console.log(`[mail] verification email sent to ${to} (Brevo API)`);
    } else if (smtp) {
      await sendViaSmtp(smtp, to, email);
      console.log(`[mail] verification email sent to ${to} (SMTP)`);
    } else if (config.nodeEnv === "production") {
      console.error("[mail] no email transport configured - set BREVO_API_KEY or SMTP_HOST");
      throw new AppError(
        500,
        "Email delivery isn't available right now. Please try again later or contact support."
      );
    } else if (config.nodeEnv === "development") {
      // Local dev without a transport: surface the code so registration is
      // testable. Never runs in production or the test suite.
      console.log(`[mail:dev] verification code for ${to}: ${code}`);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error(`[mail] failed to send verification email: ${err.message}`);
    throw new AppError(
      502,
      "We couldn't send the verification email right now. Please try again in a moment."
    );
  }

  if (config.nodeEnv !== "production") {
    recentCodes.set(String(to).toLowerCase(), code);
  }
}

function _getLastVerificationCode(email) {
  return recentCodes.get(String(email).toLowerCase()) || null;
}

module.exports = { sendVerificationEmail, _getLastVerificationCode };
