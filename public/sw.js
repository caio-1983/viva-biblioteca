// Empty service worker — prevents 404 noise in the dev server log
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
