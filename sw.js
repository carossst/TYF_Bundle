// sw.js - Fixed Service Worker v2.2.1
// This service worker handles caching and resolves path issues

const CACHE_NAME = 'test-your-french-cache-v2.2.1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './js/main.js',
  './js/ui.js',
  './js/quizManager.js',
  './js/resourceManager.js',
  './js/storage.js',
  './js/data/metadata.json',  // Corrected path
  './icons/icon-192x192.png',
  './manifest.json'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .catch(error => {
        console.error('[Service Worker] Install error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - handle requests with cache strategy
self.addEventListener('fetch', (event) => {
  // Parse the URL
  const requestUrl = new URL(event.request.url);
  
  // Handle data files specially - adjust paths as needed
  if (requestUrl.pathname.includes('/metadata.json')) {
    event.respondWith(handleDataRequest('./js/data/metadata.json'));
    return;
  }
  
  // For quiz files, adjust path if needed
  if (requestUrl.pathname.match(/\/quiz_\d+\.json$/)) {
    const quizFile = requestUrl.pathname.split('/').pop();
    const themeMatch = requestUrl.pathname.match(/theme_(\d+)/);
    if (themeMatch && themeMatch[1]) {
      const themeId = themeMatch[1];
      const correctedPath = `./js/data/quizzes/theme_${themeId}/${quizFile}`;
      event.respondWith(handleDataRequest(correctedPath));
      return;
    }
  }
  
  // Standard cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached response
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache cross-origin requests
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone response to cache it
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch error:', error);
            // Return a fallback page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Special handler for data requests
function handleDataRequest(correctedPath) {
  return caches.match(correctedPath)
    .then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Try fetching with corrected path
      return fetch(correctedPath)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            throw new Error('Failed to fetch data');
          }
          
          // Clone and cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(correctedPath, responseToCache);
            });
            
          return networkResponse;
        })
        .catch(error => {
          console.error('[Service Worker] Data fetch error:', error);
          return new Response(JSON.stringify({error: 'Failed to load data'}), {
            headers: {'Content-Type': 'application/json'},
            status: 404
          });
        });
    });
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.action === 'checkForUpdates') {
    console.log('[Service Worker] Checking for updates');
    // You would add update logic here
  }
  
  if (event.data && event.data.action === 'cacheAudio') {
    const audioUrl = event.data.url;
    if (audioUrl) {
      caches.open(CACHE_NAME)
        .then(cache => {
          fetch(audioUrl)
            .then(response => {
              if (response.ok) {
                cache.put(audioUrl, response);
                console.log('[Service Worker] Cached audio file:', audioUrl);
              }
            })
            .catch(error => {
              console.error('[Service Worker] Audio caching error:', error);
            });
        });
    }
  }
});