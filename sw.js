/*
 * sw.js - Version 2.2.0 (12 avril 2024)
 * Service Worker pour Test Your French (Quiz multi-thèmes)
 * Stratégie: Cache First pour l'App Shell et les ressources pré-cachées.
 * Cache dynamiquement les données de quiz JSON et les fichiers audio au fur et à mesure.
 */

const CACHE_NAME = 'french-quiz-cache-v2.2'; // !! IMPORTANT: Changer cette version lors de mises à jour majeures du contenu/code !!

// Ressources essentielles de l'application (App Shell) + metadata
const CORE_CACHE_RESOURCES = [
  '/', // Important pour la racine
  'index.html',
  'style.css',
  'manifest.json',
  'sw.js', // Le SW lui-même, pour les mises à jour
  // Fichiers JavaScript Core (nécessaires pour démarrer et naviguer)
  'js/main.js',
  'js/resourceManager.js',
  'js/themeController.js',
  'js/quizManager.js',
  'js/ui.js',
  'js/storage.js',
  // Métadonnées des thèmes/quiz
  'js/data/metadata.json',
  // Icônes principales
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // CDN externe (Font Awesome) - Pour une meilleure expérience offline
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- Installation ---
self.addEventListener('install', event => {
  console.log(`[SW ${CACHE_NAME}] Installing...`);
  self.skipWaiting(); // Force l'activation immédiate du nouveau SW

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${CACHE_NAME}] Caching core App Shell resources:`, CORE_CACHE_RESOURCES);
        // Tenter de mettre en cache l'App Shell. Si cela échoue, l'installation échoue.
        return cache.addAll(CORE_CACHE_RESOURCES);
      })
      .then(() => {
        console.log(`[SW ${CACHE_NAME}] Core resources cached successfully!`);
        // Envoyer message à l'app (optionnel)
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
           if(clients && clients.length){ clients.forEach(client => client.postMessage({ type: 'app-ready-offline' })); }
        });
      })
      .catch(error => {
        // Si l'App Shell ne peut pas être mis en cache, l'installation échoue.
        console.error(`[SW ${CACHE_NAME}] Installation failed: Could not cache core resources.`, error);
        // Il est crucial que l'App Shell soit mis en cache pour que l'app fonctionne offline.
        throw error; // Force l'échec de l'installation
      })
  );
});

// --- Activation & Nettoyage ---
self.addEventListener('activate', event => {
  console.log(`[SW ${CACHE_NAME}] Activating...`);
  // Prendre contrôle immédiat pour que les nouvelles stratégies de fetch s'appliquent
  event.waitUntil(self.clients.claim());

  // Nettoyer les anciens caches qui ne correspondent pas à CACHE_NAME
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME) // Garde seulement le nouveau cache
          .map(cacheName => {
            console.log(`[SW ${CACHE_NAME}] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log(`[SW ${CACHE_NAME}] Activation complete. Old caches cleaned.`);
    })
  );
});

// --- Interception Fetch (Stratégie Cache First, Network Fallback, Cache on Network Success) ---
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignorer requêtes non-GET et extensions chrome/internes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Ne pas mettre en cache les API externes (si vous en ajoutez)
  // if (request.url.includes('some-external-api.com')) { return; }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      // 1. Essayer de trouver la requête dans le cache
      return cache.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // console.log(`[SW ${CACHE_NAME}] Serving from Cache: ${request.url}`);
          return cachedResponse; // Ressource trouvée dans le cache
        }

        // 2. Non trouvé dans le cache -> Aller au réseau
        // console.log(`[SW ${CACHE_NAME}] Cache miss, fetching from Network: ${request.url}`);
        return fetch(request).then(networkResponse => {
          // Si la réponse réseau est valide (status 2xx)
          if (networkResponse && networkResponse.ok) {
            // Cloner la réponse car elle ne peut être lue qu'une fois
            const responseToCache = networkResponse.clone();
            // Mettre la réponse réussie en cache pour la prochaine fois
            // console.log(`[SW ${CACHE_NAME}] Caching successful network response: ${request.url}`);
            cache.put(request, responseToCache);
          } else if (networkResponse) {
             // Si réponse réseau non OK (404, 500), ne PAS la mettre en cache
             console.warn(`[SW ${CACHE_NAME}] Network response not OK (${networkResponse.status}) for: ${request.url}. Won't cache.`);
          }
          // Retourner la réponse réseau (même si elle n'est pas "ok", le navigateur gérera l'erreur)
          return networkResponse;

        }).catch(error => {
          // 3. Échec complet du réseau (typiquement offline)
          console.warn(`[SW ${CACHE_NAME}] Network fetch failed for: ${request.url}`, error);
          // Ici, on pourrait retourner une page offline générique si elle est pré-cachée:
          // return cache.match('/offline.html');
          // Ou juste une réponse d'erreur simple :
          return new Response("Network error fetching resource.", {
            status: 408, // Request Timeout
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      });
    })
  );
});

// --- Gestion des Messages ---
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log(`[SW ${CACHE_NAME}] Received skipWaiting command.`);
    self.skipWaiting();
  }
  // Potentiellement ajouter d'autres actions ici
});