import { useEffect, useState } from 'react';
import api from '../api/axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Register service worker
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(async (reg) => {
        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        // if (existing) { setSubscribed(true); return; }
        if (existing) {
          await api.post('/push/subscribe', existing.toJSON());
          setSubscribed(true);
          return;
        }
        // Auto-subscribe if permission already granted
        if (Notification.permission === 'granted') {
          await subscribe(reg);
        }
      })
      .catch(() => { }); // SW registration failed — silent fallback
  }, [userId]);

  const subscribe = async (reg) => {
    try {
      const { data } = await api.get('/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      const sub = await (reg || await navigator.serviceWorker.ready)
        .pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });

      await api.post('/push/subscribe', sub.toJSON());
      setSubscribed(true);
    } catch { /* silent — push not critical */ }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      const reg = await navigator.serviceWorker.ready;
      await subscribe(reg);
    }
  };

  return { permission, subscribed, requestPermission };
}
