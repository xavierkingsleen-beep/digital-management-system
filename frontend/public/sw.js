// HostelMS Service Worker — handles background push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try { payload = event.data.json(); } catch { payload = { title: 'HostelMS', message: event.data.text() }; }

  const title = payload.title || 'HostelMS Notification';
  const options = {
    body: payload.message || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.actionUrl || 'hostelms',   // deduplicates same-URL notifications
    data: { actionUrl: payload.actionUrl || '/' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || '/';
  const fullUrl = self.location.origin + actionUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          client.focus();
          client.navigate(fullUrl);
          return;
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(fullUrl);
    })
  );
});
