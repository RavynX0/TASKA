// Client-only notification preferences, persisted in localStorage.
//
// What lives here vs. elsewhere:
//   - here:   the default reminder lead time for new tasks, and the small bits
//             of UI memory that keep Taska from nagging (primer dismissed /
//             armed). None of this needs the server.
//   - server: startTimeNotifications / followUpNotifications toggles, because
//             only the backend scheduler can act on them (see AuthContext).
//   - browser: the actual "notifications on/off" master switch is simply
//             whether a push subscription exists.

const KEY = "taska.notifications.prefs";

const DEFAULTS = {
  // null = user has never decided; true/false = explicit choice from the primer
  // or Settings. Drives whether a granted-permission device re-subscribes on
  // load, so "Turn off" actually sticks.
  enabled: null,
  defaultReminderMinutes: 10,
  // ms timestamp of the last time the user dismissed the pre-permission primer,
  // or null. We stay quiet for PRIMER_SNOOZE_MS after a dismissal.
  primerDismissedAt: null,
  // Set once the user has done something that implies they'd want reminders
  // (created a scheduled task, or opted in from Settings). The browser
  // permission prompt is never shown before this is true.
  primerArmed: false,
};

export const PRIMER_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function readPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writePrefs(patch) {
  const next = { ...readPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage disabled - degrade silently */
  }
  return next;
}

export function primerIsAllowed(prefs = readPrefs()) {
  if (!prefs.primerArmed) return false;
  if (!prefs.primerDismissedAt) return true;
  return Date.now() - prefs.primerDismissedAt > PRIMER_SNOOZE_MS;
}
