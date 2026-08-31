-- Email verification for account registration.
--
-- Existing accounts are backfilled to verified so this change never locks
-- anyone out; only sign-ups from here on must confirm a 6-digit code before
-- their first login. Login itself stays a single step (email + password).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

UPDATE users SET email_verified = true WHERE email_verified = false;

-- One-time codes, hashed with bcrypt (never stored in plaintext), kept in their
-- own table rather than on `users`. `purpose` scopes each row so password-reset
-- codes can be added later without mixing with email-verification codes.
CREATE TABLE IF NOT EXISTS email_verifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose      VARCHAR(32) NOT NULL DEFAULT 'email_verification',
  code_hash    VARCHAR(255) NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_purpose
  ON email_verifications (user_id, purpose);
