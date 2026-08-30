-- Tracks the additional notification touchpoints in the task lifecycle
-- (start-time nudge, due-time check-in, snooze/check-in state). Existing
-- columns (due_date, start_time, reminder_minutes, reminder_sent_at) already
-- cover the "before start" reminder and are unchanged.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snooze_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snooze_count INTEGER NOT NULL DEFAULT 0;
