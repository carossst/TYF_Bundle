// sw.js - Service Worker adapté à votre structure exacte
const CACHE_NAME = 'test-your-french-cache-v2.2.2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/main.js',           // Chemin correct
  './js/quizManager.js',    // Chemin correct
  './js/resourceManager.js', // Chemin correct
  './js/storage.js',        // Chemin correct
  './js/ui.js',             // Chemin correct
  './js/data/metadata.json', // Chemin correct
  './icons/icon-192x192.png'
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
  
  // Handle metadata.json specially
  if (requestUrl.pathname.includes('/metadata.json')) {
    event.respondWith(handleMetadataRequest());
    return;
  }
  
  // For quiz files, adjust path based on your structure
  if (requestUrl.pathname.match(/\/quiz_\d+\.json$/)) {
    const quizFile = requestUrl.pathname.split('/').pop();
    const themeMatch = requestUrl.pathname.match(/theme-(\d+)/);
    if (themeMatch && themeMatch[1]) {
      const themeId = themeMatch[1];
      event.respondWith(handleQuizRequest(themeId, quizFile));
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

// Special handler for metadata.json requests
async function handleMetadataRequest() {
  const possiblePaths = [
    './js/data/metadata.json',      // Chemin correct (primaire)
    './metadata.json',              // Fallback à la racine
    './js/metadata.json',           // Autre alternative
    './js/data/themes/metadata.json', // Autre alternative
    // Chemins GitHub Pages
    '/TYF_Bundle/js/data/metadata.json',
    '/TYF_Bundle/metadata.json'
  ];
  
  // Try cache first
  for (const path of possiblePaths) {
    const cachedResponse = await caches.match(path);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Try fetching from network
  for (const path of possiblePaths) {
    try {
      const networkResponse = await fetch(path);
      if (networkResponse && networkResponse.status === 200) {
        // Clone and cache
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(path, responseToCache);
        return networkResponse;
      }
    } catch (error) {
      console.warn(`[Service Worker] Failed to fetch metadata from ${path}`);
    }
  }
  
  return new Response(JSON.stringify({error: 'Failed to load metadata'}), {
    headers: {'Content-Type': 'application/json'},
    status: 404
  });
}

// Special handler for quiz requests
async function handleQuizRequest(themeId, quizFile) {
  const possiblePaths = [
    `./js/data/themes/theme-${themeId}/${quizFile}`,  // Structure originale
    `./themes/theme-${themeId}/${quizFile}`,          // Alternative sans js/data
    `./theme-${themeId}/${quizFile}`,                 // Alternative sans themes/
    `./js/data/themes/theme-${themeId}/quiz_${quizFile.split('_')[1]}`, // Alternative sans "quiz_" préfixe
    // Chemins GitHub Pages
    `/TYF_Bundle/js/data/themes/theme-${themeId}/${quizFile}`,
    `/TYF_Bundle/themes/theme-${themeId}/${quizFile}`
  ];
  
  // Try cache first
  for (const path of possiblePaths) {
    const cachedResponse = await caches.match(path);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Try fetching from network
  for (const path of possiblePaths) {
    try {
      const networkResponse = await fetch(path);
      if (networkResponse && networkResponse.status === 200) {
        // Clone and cache
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(path, responseToCache);
        return networkResponse;
      }
    } catch (error) {
      console.warn(`[Service Worker] Failed to fetch quiz from ${path}`);
    }
  }
  
  return new Response(JSON.stringify({error: `Failed to load quiz ${quizFile}`}), {
    headers: {'Content-Type': 'application/json'},
    status: 404
  });
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
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