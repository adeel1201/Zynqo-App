/**
 * Zynqo PWA Service Worker
 * Basic placeholder for offline support.
 */

const CACHE_NAME = 'zynqo-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now
});
