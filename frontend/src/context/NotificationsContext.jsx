import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  pushSupported,
  registerServiceWorker,
  getExistingSubscription,
  ensureSubscribed,
  unsubscribe as unsubscribePush,
} from "../notifications/pushClient";
import { readPrefs, writePrefs, primerIsAllowed } from "../notifications/notificationPrefs";

const NotificationsContext = createContext(null);

// The single source of truth for "where is this device at with notifications".
// Everything the UI needs to render is derived from this one string.
export const STATUS = {
  NOT_SUPPORTED: "NOT_SUPPORTED",
  PERMISSION_DEFAULT: "PERMISSION_DEFAULT", // never asked
  PERMISSION_GRANTED: "PERMISSION_GRANTED", // allowed, but no active push subscription
  PERMISSION_DENIED: "PERMISSION_DENIED", // blocked in the browser
  SUBSCRIBING: "SUBSCRIBING", // request/subscribe in flight
  SUBSCRIBED: "SUBSCRIBED", // fully set up on this device
  SUBSCRIPTION_FAILED: "SUBSCRIPTION_FAILED", // permission ok, backend/network step failed
};

// Lightweight cross-tab coordination. Push delivery itself is already
// single-instance (one service worker per origin, notifications collapsed by
// tag), so this is only about keeping the *UI* in every open tab consistent -
// if you enable notifications or dismiss the primer in one tab, the others
// should reflect it without each re-subscribing.
const CHANNEL = "taska-notifications";
const SUCCESS_VISIBLE_MS = 5000;

export function NotificationsProvider({ children }) {
  const [permission, setPermission] = useState(
    pushSupported ? Notification.permission : "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failed, setFailed] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const channelRef = useRef(null);
  const successTimer = useRef(null);

  const broadcast = useCallback((msg) => {
    channelRef.current?.postMessage(msg);
  }, []);

  // --- one-time setup: SW registration + opportunistic re-sync -------------
  useEffect(() => {
    if (!pushSupported) return;

    // The SW is needed for notification clicks/actions even before the user
    // opts in, so register it regardless. This does NOT prompt for permission.
    registerServiceWorker().catch(() => {});

    const stored = readPrefs();
    getExistingSubscription()
      .then(async (existing) => {
        // Only re-sync when permission is granted AND the user hasn't turned
        // notifications off. `enabled === null` (never decided) with no existing
        // subscription means "wait for the primer" - don't subscribe behind
        // their back. An existing subscription implies a past opt-in.
        const wantsSync =
          Notification.permission === "granted" &&
          stored.enabled !== false &&
          (existing || stored.enabled === true);

        if (wantsSync) {
          try {
            await ensureSubscribed();
            setSubscribed(true);
          } catch {
            setSubscribed(Boolean(existing));
          }
        } else {
          setSubscribed(Boolean(existing) && stored.enabled !== false);
        }
      })
      .catch(() => {});

    if ("BroadcastChannel" in window) {
      const ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (e) => {
        const { type } = e.data || {};
        if (type === "state") {
          setSubscribed(e.data.subscribed);
          setPermission(e.data.permission);
        } else if (type === "prefs") {
          setPrefs(readPrefs());
        }
      };
      channelRef.current = ch;
      return () => ch.close();
    }
  }, []);

  useEffect(() => () => clearTimeout(successTimer.current), []);

  const savePrefs = useCallback(
    (patch) => {
      const next = writePrefs(patch);
      setPrefs(next);
      broadcast({ type: "prefs" });
      return next;
    },
    [broadcast]
  );

  // Called when the user does something that implies they'd want reminders
  // (creates their first scheduled task, or opts in from Settings). Only after
  // this is the pre-permission primer allowed to appear.
  const armPrimer = useCallback(() => {
    if (!prefs.primerArmed) savePrefs({ primerArmed: true });
  }, [prefs.primerArmed, savePrefs]);

  const dismissPrimer = useCallback(() => {
    savePrefs({ primerDismissedAt: Date.now() });
  }, [savePrefs]);

  const flashSuccess = useCallback(() => {
    setJustEnabled(true);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setJustEnabled(false), SUCCESS_VISIBLE_MS);
  }, []);

  // Turn notifications on. MUST be triggered by a user gesture (primer CTA or
  // the Settings button) - that's what lets the browser show its permission
  // prompt. The browser permission and the backend subscription are separate
  // steps: a granted permission with a failed subscription is NOT success.
  const enable = useCallback(async () => {
    if (!pushSupported) return;
    setLoading(true);
    setError(null);
    setFailed(false);
    try {
      const result =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        // Denied or dismissed: never auto-ask again. The primer keys off
        // permission !== 'default', so it disappears on its own.
        return;
      }

      try {
        await ensureSubscribed();
      } catch {
        setFailed(true);
        setError("We couldn't finish setting up notifications. Check your connection and try again.");
        return;
      }

      savePrefs({ enabled: true });
      setSubscribed(true);
      flashSuccess();
      broadcast({ type: "state", subscribed: true, permission: result });
    } catch (err) {
      setError(err?.message || "Couldn't enable notifications on this device.");
    } finally {
      setLoading(false);
    }
  }, [broadcast, flashSuccess, savePrefs]);

  const disable = useCallback(async () => {
    if (!pushSupported) return;
    setLoading(true);
    setError(null);
    setJustEnabled(false);
    try {
      await unsubscribePush();
      savePrefs({ enabled: false });
      setSubscribed(false);
      broadcast({ type: "state", subscribed: false, permission });
    } catch (err) {
      setError(err?.message || "Couldn't turn notifications off.");
    } finally {
      setLoading(false);
    }
  }, [broadcast, permission, savePrefs]);

  // Browsers don't reliably fire an event when the user changes the site
  // permission in their settings, so the denied-state UI offers a manual
  // re-check. If they've since allowed it, pick the subscription back up.
  const recheckPermission = useCallback(async () => {
    if (!pushSupported) return;
    const current = Notification.permission;
    setPermission(current);
    if (current === "granted" && readPrefs().enabled !== false) {
      setLoading(true);
      try {
        await ensureSubscribed();
        savePrefs({ enabled: true });
        setSubscribed(true);
        broadcast({ type: "state", subscribed: true, permission: current });
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
  }, [broadcast, savePrefs]);

  const setDefaultReminderMinutes = useCallback(
    (minutes) => savePrefs({ defaultReminderMinutes: minutes }),
    [savePrefs]
  );

  // Shows a notification straight from the service worker - no push round-trip.
  // Purely a diagnostic. Reports back via `testResult` so the UI can say what
  // happened (JS can't tell whether the OS actually drew it on screen).
  const [testResult, setTestResult] = useState(null);
  const sendTestNotification = useCallback(async () => {
    setError(null);
    setTestResult({ kind: "sending" });
    try {
      if (!pushSupported) {
        setTestResult({ kind: "error", message: "This browser can't show notifications." });
        return;
      }
      let perm = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== "granted") {
        setTestResult({
          kind: "blocked",
          message:
            perm === "denied"
              ? "Notifications are blocked in your browser's site settings."
              : "You didn't grant notification permission.",
        });
        return;
      }
      const reg = await registerServiceWorker();
      // Unique tag every click, so a still-open previous test can never make a
      // new one replace it silently.
      const tag = `taska-test-${Date.now()}`;
      await reg.showNotification("Taska test notification", {
        body: "If you can see this, notifications are working.",
        icon: "/icon-192.png",
        badge: "/badge-96.png",
        tag,
        requireInteraction: true,
      });
      // Count how many test notifications the OS is now holding for Taska -
      // proof they're being created even if the banner isn't drawing.
      const all = await reg.getNotifications();
      const testCount = all.filter((n) => (n.tag || "").startsWith("taska-test")).length;
      setTestResult({ kind: "sent", testCount });
    } catch (err) {
      setTestResult({ kind: "error", message: err?.message || "Couldn't show a test notification." });
    }
  }, []);

  const primerVisible =
    pushSupported && permission === "default" && !subscribed && primerIsAllowed(prefs);

  const status = useMemo(() => {
    if (!pushSupported) return STATUS.NOT_SUPPORTED;
    if (permission === "denied") return STATUS.PERMISSION_DENIED;
    if (loading) return STATUS.SUBSCRIBING;
    if (subscribed) return STATUS.SUBSCRIBED;
    if (failed) return STATUS.SUBSCRIPTION_FAILED;
    if (permission === "granted") return STATUS.PERMISSION_GRANTED;
    return STATUS.PERMISSION_DEFAULT;
  }, [permission, subscribed, loading, failed]);

  const value = useMemo(
    () => ({
      isSupported: pushSupported,
      status,
      permission,
      subscribed,
      loading,
      error,
      justEnabled,
      primerVisible,
      defaultReminderMinutes: prefs.defaultReminderMinutes,
      enable,
      disable,
      recheckPermission,
      armPrimer,
      dismissPrimer,
      setDefaultReminderMinutes,
      sendTestNotification,
      testResult,
    }),
    [
      status,
      permission,
      subscribed,
      loading,
      error,
      justEnabled,
      primerVisible,
      prefs.defaultReminderMinutes,
      enable,
      disable,
      recheckPermission,
      armPrimer,
      dismissPrimer,
      setDefaultReminderMinutes,
      sendTestNotification,
      testResult,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
