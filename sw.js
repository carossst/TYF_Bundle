/* sw.js — Service Worker CORRIGÉ pour GitHub Pages - Version 2.3.1 */

// 🔧 CORRECTION VERSION et chemins GitHub Pages
const CACHE_NAME = "tyf-cache-v2.3.1";
const DYNAMIC_CACHE = "tyf-dynamic-v2.3.1";

// 🔧 CORRECTION CHEMINS - Assets adaptés pour GitHub Pages
const ASSETS_TO_CACHE = [
  "/TYF_Bundle/",
  "/TYF_Bundle/index.html",
  "/TYF_Bundle/style.css",
  "/TYF_Bundle/js/main.js",
  "/TYF_Bundle/js/ui.js",
  "/TYF_Bundle/js/quizManager.js",
  "/TYF_Bundle/js/resourceManager.js",
  "/TYF_Bundle/js/storage.js",
  "/TYF_Bundle/manifest.json",
  // Fallbacks pour localhost
  "/",
  "./index.html",
  "./style.css",
  "./js/main.js",
  "./js/ui.js",
  "./js/quizManager.js",
  "./js/resourceManager.js",
  "./js/storage.js",
  "./manifest.json"
];

// INSTALL — Mise en cache initiale robuste
self.addEventListener("install", event => {
  console.log("[SW] Install - Version:", CACHE_NAME);
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW] Precaching app shell - Cache: ${CACHE_NAME}`);
        // 🔧 CORRECTION - Gestion d'erreur améliorée pour chaque asset
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(asset => 
            cache.add(asset).catch(err => {
              console.warn(`[SW] Failed to cache ${asset}:`, err.message);
              return null;
            })
          )
        );
      })
      .then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        const success = results.length - failed;
        console.log(`[SW] Precaching completed: ${success}/${results.length} assets cached`);
        if (failed > 0) {
          console.warn(`[SW] ${failed} assets failed to cache but SW installation continues`);
        }
      })
      .catch(err => {
        console.error("[SW] Critical precaching error:", err);
        // Ne pas throw l'erreur pour permettre l'installation même partielle
      })
  );
});

// ACTIVATE — Nettoyage des anciens caches
self.addEventListener("activate", event => {
  console.log("[SW] Activate - Version:", CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Suppression des anciens caches
      caches.keys().then(keys => {
        console.log("[SW] Existing caches:", keys);
        return Promise.all(
          keys
            .filter(key => key.startsWith('tyf-') && key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map(key => {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        );
      }),
      // Prise de contrôle immédiate
      self.clients.claim()
    ])
  );
});

// FETCH — Stratégie de cache améliorée
self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  // Ignorer les requêtes non-HTTP(S)
  if (!requestUrl.protocol.startsWith("http")) {
    return;
  }

  // Ignorer les extensions de navigateur
  if (requestUrl.protocol === "chrome-extension:") {
    return;
  }

  // 🎵 CORRECTION AUDIO - Stratégie spéciale pour les fichiers audio
  if (requestUrl.pathname.includes('/audio/') && 
      (requestUrl.pathname.endsWith('.mp3') || 
       requestUrl.pathname.endsWith('.ogg') || 
       requestUrl.pathname.endsWith('.wav'))) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  // Stratégie Network-First pour les fichiers JSON
  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(handleJsonRequest(request));
    return;
  }

  // Stratégie Cache-First pour les assets statiques
  event.respondWith(handleStaticRequest(request));
});

// 🎵 NOUVELLE FONCTION - Gestion spéciale des fichiers audio
async function handleAudioRequest(request) {
  console.log(`[SW] Audio request: ${request.url}`);
  
  try {
    // Essayer le cache d'abord pour les fichiers audio
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`[SW] Audio served from cache: ${request.url}`);
      return cachedResponse;
    }

    // Si pas en cache, essayer le réseau
    const response = await fetch(request);
    if (response.ok) {
      // Mettre en cache seulement si succès
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log(`[SW] Audio cached: ${request.url}`);
      return response;
    }
    
    throw new Error(`Audio network response not ok: ${response.status}`);
  } catch (error) {
    console.warn(`[SW] Audio request failed: ${request.url}`, error.message);
    
    // Retourner une réponse d'erreur audio silencieuse
    return new Response(null, {
      status: 404,
      statusText: 'Audio file not found'
    });
  }
}

// Gestion des requêtes JSON (Network-First avec fallback cache)
async function handleJsonRequest(request) {
  console.log(`[SW] JSON request: ${request.url}`);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log(`[SW] JSON cached: ${request.url}`);
      return response;
    }
    throw new Error(`Network response not ok: ${response.status}`);
  } catch (error) {
    console.warn(`[SW] JSON network failed: ${request.url}`, error.message);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`[SW] JSON served from cache: ${request.url}`);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Gestion des requêtes statiques (Cache-First)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log(`[SW] Static served from cache: ${request.url}`);
    return cachedResponse;
  }

  console.log(`[SW] Static fetch from network: ${request.url}`);
  
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      console.log(`[SW] Static cached: ${request.url}`);
    }
    
    return response;
  } catch (error) {
    console.error(`[SW] Static network failed: ${request.url}`, error);
    
    // 🔧 CORRECTION - Page d'erreur plus informative
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Application hors ligne</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .offline-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .offline-icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 15px; }
            p { color: #666; line-height: 1.6; }
            .retry-btn { background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-top: 20px; }
            .retry-btn:hover { background: #1976D2; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📡</div>
            <h1>Application hors ligne</h1>
            <p>Cette page n'est pas disponible hors ligne. Vérifiez votre connexion internet et réessayez.</p>
            <button class="retry-btn" onclick="window.location.reload()">Réessayer</button>
          </div>
        </body>
        </html>`,
        { 
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 503,
          statusText: 'Service Unavailable'
        }
      );
    }
    
    throw error;
  }
}

// Gestion des messages
self.addEventListener('message', event => {
  console.log("[SW] Message received:", event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'CACHE_AUDIO':
      // 🎵 NOUVELLE FONCTIONNALITÉ - Pré-cacher des fichiers audio spécifiques
      if (event.data.audioUrls && Array.isArray(event.data.audioUrls)) {
        cacheAudioFiles(event.data.audioUrls).then(results => {
          event.ports[0].postMessage({ 
            success: true, 
            cached: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          });
        });
      }
      break;
  }
});

// 🎵 NOUVELLE FONCTION - Pré-cache des fichiers audio
async function cacheAudioFiles(audioUrls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const results = [];
  
  for (const url of audioUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        results.push({ url, success: true });
        console.log(`[SW] Audio pre-cached: ${url}`);
      } else {
        results.push({ url, success: false, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      results.push({ url, success: false, error: error.message });
      console.warn(`[SW] Failed to pre-cache audio: ${url}`, error.message);
    }
  }
  
  return results;
}

// Fonction utilitaire pour vider les caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  console.log("[SW] All caches cleared");
}

// 🔧 AMÉLIORATION - Gestion d'erreur globale du Service Worker
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Empêche l'erreur de remonter
});