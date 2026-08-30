// Low-level Web Push plumbing: service worker registration + PushSubscription
// lifecycle. No React, no app state - just promises. The React layer
// (NotificationsContext) owns the "when".

import * as pushApi from "../api/push";
import { urlBase64ToUint8Array } from "../utils/push";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4310";
// Config the classic (non-module) service worker can't import is passed on the
// registration URL. Keep this path stable so the browser reuses one SW.
const SW_URL = `/sw.js?apiUrl=${encodeURIComponent(API_URL)}`;

export const pushSupported =
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

let registrationPromise = null;

// Idempotent: every caller/tab shares the one registration promise, and the
// browser itself dedupes registrations for the same scope.
export function registerServiceWorker() {
  if (!pushSupported) return Promise.resolve(null);
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SW_URL)
      .then(() => navigator.serviceWorker.ready)
      .catch((err) => {
        registrationPromise = null;
        throw err;
      });
  }
  return registrationPromise;
}

export async function getExistingSubscription() {
  if (!pushSupported) return null;
  const reg = await registerServiceWorker();
  return reg ? reg.pushManager.getSubscription() : null;
}

// Creates a subscription if the browser doesn't have one, then (re)registers it
// with the backend for the current user. Safe to call on every app load once
// permission is granted - handles the "subscription silently expired / was
// replaced" case by just making a fresh one.
export async function ensureSubscribed() {
  const reg = await registerServiceWorker();
  if (!reg) throw new Error("Push is not supported in this browser.");

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const publicKey = await pushApi.getVapidPublicKey();
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  // Backend upserts by endpoint, so re-sending an unchanged subscription is a
  // cheap no-op and re-binds it to this user if they switched accounts.
  await pushApi.subscribe(subscription.toJSON());
  return subscription;
}

export async function unsubscribe() {
  const sub = await getExistingSubscription();
  if (!sub) return;
  try {
    await pushApi.unsubscribe(sub.endpoint);
  } finally {
    await sub.unsubscribe();
  }
}
