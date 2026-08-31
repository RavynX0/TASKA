const path = require("path");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
// override: true so the committed .env file is the source of truth in local dev.
// Without this, a stray PGDATABASE / DATABASE_URL left in the shell environment
// silently wins over .env and the server ends up talking to the wrong database.
dotenv.config({ path: path.resolve(__dirname, "../../", envFile), override: true });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  appName: process.env.APP_NAME || "Taska",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mailFrom: process.env.MAIL_FROM || "Taska <no-reply@taska.app>",
  brevoApiKey: process.env.BREVO_API_KEY || null,
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
  },
  emailVerification: {
    codeTtlMinutes: parseInt(process.env.VERIFICATION_CODE_TTL_MINUTES || "10", 10),
    maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS || "5", 10),
    resendCooldownSeconds: parseInt(process.env.VERIFICATION_RESEND_COOLDOWN_SECONDS || "60", 10),
  },
  // Local dev / CI set the discrete PG* vars; most hosts (Render, Railway, Neon,
  // Supabase, Fly) hand you a single DATABASE_URL instead. Prefer the discrete
  // vars when present so existing setups are untouched, else fall back to the URL.
  db: process.env.PGHOST
    ? {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: required("PGUSER"),
        password: required("PGPASSWORD"),
        database: required("PGDATABASE"),
      }
    : { connectionString: required("DATABASE_URL") },
  // Hosted Postgres almost always requires SSL; local Postgres almost never does.
  // Opt in with PGSSL=true (or opt out in prod with PGSSL=false).
  dbSsl:
    process.env.PGSSL === "true" ||
    ((process.env.NODE_ENV || "development") === "production" && process.env.PGSSL !== "false"),
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
    privateKey: process.env.VAPID_PRIVATE_KEY || null,
    subject: process.env.VAPID_SUBJECT || "mailto:example@example.com",
  },
};
