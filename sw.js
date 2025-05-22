/* sw.js — Service Worker production-ready avec améliorations */

// Version incrémentée pour forcer la mise à jour
const CACHE_NAME = "tyf-cache-v2.2.5";
const DYNAMIC_CACHE = "tyf-dynamic-v2.2.5";

// Assets statiques à pré-cacher
const ASSETS_TO_CACHE = [
  "/",
  "/TYF_Bundle/",
  "/TYF_Bundle/index.html",
  "/TYF_Bundle/style.css",
  "/TYF_Bundle/js/main.js",
  "/TYF_Bundle/js/ui.js",
  "/TYF_Bundle/js/quizManager.js",
  "/TYF_Bundle/js/resourceManager.js",
  "/TYF_Bundle/js/storage.js",
  "/TYF_Bundle/manifest.json"
];

// INSTALL — Mise en cache initiale avec gestion d'erreur robuste
self.addEventListener("install", event => {
  console.log("[SW] Install - Version:", CACHE_NAME);
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW] Precaching app shell - Cache: ${CACHE_NAME}`);
        // Utilisation de Promise.allSettled pour continuer même si certains assets échouent
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
        throw err;
      })
  );
});

// ACTIVATE — Nettoyage des anciens caches + dynamic cache
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

  // Stratégie Network-First pour les fichiers JSON (données dynamiques)
  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(
      handleJsonRequest(request)
    );
    return;
  }

  // Stratégie Cache-First pour les assets statiques
  event.respondWith(
    handleStaticRequest(request)
  );
});

// Gestion des requêtes JSON (Network-First avec fallback cache)
async function handleJsonRequest(request) {
  console.log(`[SW] JSON request: ${request.url}`);
  
  try {
    // Essayer le réseau en premier
    const response = await fetch(request);
    if (response.ok) {
      // Mise en cache du résultat pour usage hors ligne
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log(`[SW] JSON cached: ${request.url}`);
      return response;
    }
    throw new Error(`Network response not ok: ${response.status}`);
  } catch (error) {
    console.warn(`[SW] JSON network failed: ${request.url}`, error.message);
    
    // Fallback vers le cache si disponible
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`[SW] JSON served from cache: ${request.url}`);
      return cachedResponse;
    }
    
    // Si pas de cache, retourner l'erreur réseau
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
    
    // Validation de la réponse avant mise en cache
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      console.log(`[SW] Static cached: ${request.url}`);
    }
    
    return response;
  } catch (error) {
    console.error(`[SW] Static network failed: ${request.url}`, error);
    
    // Pour les pages HTML, retourner une page d'erreur générique
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        '<h1>Offline</h1><p>Cette page n\'est pas disponible hors ligne.</p>',
        { headers: { 'Content-Type': 'text/html' } }
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
  }
});

// Fonction utilitaire pour vider les caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  console.log("[SW] All caches cleared");
}