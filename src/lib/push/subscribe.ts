function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
  return navigator.serviceWorker.register("/sw.js");
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  return Notification.requestPermission();
}

export async function getSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  return reg?.pushManager.getSubscription() ?? null;
}

export async function isSubscribed(): Promise<boolean> {
  const sub = await getSubscription();
  return !!sub;
}

export async function subscribeToPush(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("VAPID public key not configured");

  const permission = await requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");

  const reg = await registerServiceWorker();
  await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
  });

  const sub = await reg.pushManager.getSubscription();
  if (!sub) throw new Error("Subscription failed");

  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) throw new Error("Failed to save subscription");
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
