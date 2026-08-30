-- Per-user notification preferences. Kept as a single JSONB blob so new toggles
-- can be added without another migration. Empty object = "all defaults on";
-- the app layer merges this over its own defaults, so an absent key never means
-- "off". Only the server-enforced toggles live here (start-time nudge,
-- follow-up check-ins). The master on/off switch is just whether the browser
-- has a live push subscription, and the default reminder lead time is a
-- client-only convenience stored in the browser.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
