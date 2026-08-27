import { createContext, useContext, useEffect, useState } from "react";
import * as pushApi from "../api/push";
import { urlBase64ToUint8Array } from "../utils/push";

const NotificationsContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SW_URL = `/sw.js?apiUrl=${encodeURIComponent(API_URL)}`;

const isSupported =
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export function NotificationsProvider({ children }) {
  const [permission, setPermission] = useState(isSupported ? Notification.permission : "unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        setSubscribed(Boolean(existing));
        // Default to on: try to enable automatically so most users never have to
        // find the toggle in Profile. The browser still owns the actual permission
        // prompt on a user's very first visit - that native dialog can't be
        // skipped or auto-accepted by any app, by design (it's how every site's
        // notification permission works). Once granted, this makes every later
        // visit silent.
        if (!existing && Notification.permission !== "denied") {
          enable();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    if (!isSupported) return;
    setLoading(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const publicKey = await pushApi.getVapidPublicKey();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await pushApi.subscribe(subscription.toJSON());
      setSubscribed(true);
    } catch (err) {
      setError(err.message || "Couldn't enable notifications on this device.");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    if (!isSupported) return;
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err.message || "Couldn't disable notifications.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <NotificationsContext.Provider
      value={{ isSupported, permission, subscribed, loading, error, enable, disable }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
