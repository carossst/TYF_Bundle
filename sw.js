/* swUpdateManager.js - Gestionnaire intelligent des mises à jour du Service Worker */

window.SWUpdateManager = (function() {
  function SWUpdateManagerClass() {
    this.registration = null;
    this.isUpdateAvailable = false;
    this.isRefreshing = false;
    
    // Configuration
    this.config = {
      checkInterval: 60000, // Vérifier les mises à jour toutes les minutes
      autoUpdate: false,    // Ne pas forcer les mises à jour automatiquement
      showNotifications: true
    };
    
    // Événements personnalisés
    this.events = new EventTarget();
    
    this.init();
  }

  // Initialisation
  SWUpdateManagerClass.prototype.init = function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        this.registerServiceWorker();
      });
      
      // Écouter les changements de contrôleur
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        console.log('[SW Update] Reloading page for new service worker');
        window.location.reload();
      });
    } else {
      console.warn('[SW Update] Service Worker not supported');
    }
  };

  // Enregistrement du Service Worker
  SWUpdateManagerClass.prototype.registerServiceWorker = async function() {
    try {
      this.registration = await navigator.serviceWorker.register('./sw.js');
      console.log('[SW Update] Service Worker registered:', this.registration.scope);
      
      // Vérifier si un worker est en attente
      if (this.registration.waiting) {
        this.handleWaitingWorker(this.registration.waiting);
      }
      
      // Écouter les nouveaux workers
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });
      
      // Vérification périodique des mises à jour
      this.startUpdateChecker();
      
      // Événement personnalisé
      this.events.dispatchEvent(new CustomEvent('registered', { 
        detail: { registration: this.registration } 
      }));
      
    } catch (error) {
      console.error('[SW Update] Registration failed:', error);
    }
  };

  // Gestion des nouveaux workers trouvés
  SWUpdateManagerClass.prototype.handleUpdateFound = function() {
    const newWorker = this.registration.installing;
    console.log('[SW Update] New service worker found');
    
    newWorker.addEventListener('statechange', () => {
      switch (newWorker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // Nouveau worker installé, l'ancien est encore actif
            this.handleWaitingWorker(newWorker);
          } else {
            // Premier worker installé
            console.log('[SW Update] Service Worker installed for the first time');
            this.events.dispatchEvent(new CustomEvent('firstInstall'));
          }
          break;
        case 'activated':
          console.log('[SW Update] Service Worker activated');
          this.events.dispatchEvent(new CustomEvent('activated'));
          break;
      }
    });
  };

  // Gestion d'un worker en attente
  SWUpdateManagerClass.prototype.handleWaitingWorker = function(worker) {
    this.isUpdateAvailable = true;
    console.log('[SW Update] Update available');
    
    this.events.dispatchEvent(new CustomEvent('updateAvailable', {
      detail: { worker }
    }));
    
    if (this.config.showNotifications) {
      this.showUpdateNotification();
    }
    
    if (this.config.autoUpdate) {
      this.applyUpdate();
    }
  };

  // Affichage de la notification de mise à jour
  SWUpdateManagerClass.prototype.showUpdateNotification = function() {
    // Créer une notification personnalisée
    const notification = this.createUpdateNotification();
    document.body.appendChild(notification);
    
    // Auto-masquer après 10 secondes si pas d'interaction
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  };

  // Création de l'élément de notification
  SWUpdateManagerClass.prototype.createUpdateNotification = function() {
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">
          🔄 Mise à jour disponible
        </div>
        <div style="margin-bottom: 12px; font-size: 14px;">
          Une nouvelle version de l'application est disponible.
        </div>
        <div>
          <button id="sw-update-btn" style="
            background: white;
            color: #2196F3;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            font-weight: bold;
          ">
            Mettre à jour
          </button>
          <button id="sw-dismiss-btn" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">
            Plus tard
          </button>
        </div>
      </div>
    `;
    
    // Gestionnaires d'événements
    notification.querySelector('#sw-update-btn').addEventListener('click', () => {
      this.applyUpdate();
      notification.remove();
    });
    
    notification.querySelector('#sw-dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });
    
    return notification;
  };

  // Application de la mise à jour
  SWUpdateManagerClass.prototype.applyUpdate = function() {
    if (!this.registration || !this.registration.waiting) {
      console.warn('[SW Update] No update available to apply');
      return;
    }
    
    console.log('[SW Update] Applying update...');
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  // Vérification manuelle des mises à jour
  SWUpdateManagerClass.prototype.checkForUpdate = async function() {
    if (!this.registration) {
      console.warn('[SW Update] No registration available');
      return;
    }
    
    try {
      await this.registration.update();
      console.log('[SW Update] Manual update check completed');
    } catch (error) {
      console.error('[SW Update] Manual update check failed:', error);
    }
  };

  // Démarrage du vérificateur automatique
  SWUpdateManagerClass.prototype.startUpdateChecker = function() {
    if (this.config.checkInterval > 0) {
      setInterval(() => {
        this.checkForUpdate();
      }, this.config.checkInterval);
      
      console.log(`[SW Update] Auto-update checker started (${this.config.checkInterval}ms interval)`);
    }
  };

  // Configuration
  SWUpdateManagerClass.prototype.configure = function(options) {
    this.config = { ...this.config, ...options };
    console.log('[SW Update] Configuration updated:', this.config);
  };

  // Écouteurs d'événements
  SWUpdateManagerClass.prototype.on = function(event, callback) {
    this.events.addEventListener(event, callback);
  };

  SWUpdateManagerClass.prototype.off = function(event, callback) {
    this.events.removeEventListener(event, callback);
  };

  // Getters
  SWUpdateManagerClass.prototype.getRegistration = function() {
    return this.registration;
  };

  SWUpdateManagerClass.prototype.isUpdateReady = function() {
    return this.isUpdateAvailable;
  };

  // Utilitaires de diagnostic
  SWUpdateManagerClass.prototype.getInfo = async function() {
    if (!this.registration) return null;
    
    return {
      scope: this.registration.scope,
      updateViaCache: this.registration.updateViaCache,
      active: this.registration.active?.state,
      waiting: this.registration.waiting?.state,
      installing: this.registration.installing?.state,
      isUpdateAvailable: this.isUpdateAvailable
    };
  };

  return new SWUpdateManagerClass();
})();

// Utilisation simple
/*
// Configuration optionnelle
SWUpdateManager.configure({
  autoUpdate: false,
  showNotifications: true,
  checkInterval: 30000
});

// Écouteurs d'événements
SWUpdateManager.on('updateAvailable', (event) => {
  console.log('Update available!', event.detail);
});

SWUpdateManager.on('activated', () => {
  console.log('New service worker activated');
});

// Vérification manuelle
document.getElementById('check-update-btn')?.addEventListener('click', () => {
  SWUpdateManager.checkForUpdate();
});
*/