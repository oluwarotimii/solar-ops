self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
