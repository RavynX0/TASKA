import { createContext, useContext, useEffect, useState } from "react";
import * as pushApi from "../api/push";
import { urlBase64ToUint8Array } from "../utils/push";

const NotificationsContext = createContext(null);

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
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => setSubscribed(Boolean(existing)))
      .catch(() => {});
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
