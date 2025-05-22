/*
 * js/data/main.js - Version 2.2.5 (Non-module) - Amélioré pour GitHub Pages
 * Point d'entrée principal de l'application Test Your French
 */

// Configuration globale de l'application
window.TYF_CONFIG = {
  version: '2.2.5',
  environment: detectEnvironment(),
  
  // Configuration du Service Worker
  serviceWorker: {
    enabled: true,
    autoUpdate: false,
    showUpdateNotifications: true,
    checkInterval: 60000 // 1 minute
  },
  
  // Configuration de débogage
  debug: {
    enabled: detectEnvironment() === 'development',
    logLevel: detectEnvironment() === 'development' ? 'debug' : 'warn'
  }
};

// Détection de l'environnement
function detectEnvironment() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  if (hostname.includes('github.io')) return 'github-pages';
  return 'production';
}

// Logger centralisé
const Logger = {
  debug: (...args) => window.TYF_CONFIG.debug.enabled && console.log('[TYF Debug]', ...args),
  log: (...args) => console.log('[TYF]', ...args),
  warn: (...args) => console.warn('[TYF Warning]', ...args),
  error: (...args) => console.error('[TYF Error]', ...args)
};

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
  Logger.error('Global error:', event.error);
  if (window.TYF_CONFIG.debug.enabled) {
    showErrorMessage(`Erreur JavaScript: ${event.error?.message || 'Erreur inconnue'}`);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  Logger.error('Unhandled promise rejection:', event.reason);
  if (window.TYF_CONFIG.debug.enabled) {
    showErrorMessage(`Erreur de promesse: ${event.reason?.message || 'Erreur inconnue'}`);
  }
});

// L'ordre de chargement des scripts est important:
// 1. resourceManager.js  2. storage.js  3. quizManager.js  4. ui.js  5. main.js (ce fichier)

// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
  Logger.log(`Initialisation de l'application Test Your French v${window.TYF_CONFIG.version} (${window.TYF_CONFIG.environment})`);

  // Initialisation du Service Worker en priorité
  initServiceWorker();

  // Sélection des éléments DOM principaux
  const DOM = {
    screens: {
      welcome: document.getElementById('welcome-screen'),
      quizSelection: document.getElementById('quiz-selection'),
      quiz: document.getElementById('quiz-screen'),
      result: document.getElementById('result'),
      stats: document.getElementById('stats-screen')
    },
    quiz: {
      container: document.getElementById('quiz'),
      feedback: document.getElementById('feedback'),
      title: document.getElementById('quiz-name'),
      progress: {
        bar: document.getElementById('progress'),
        steps: document.getElementById('progress-steps')
      },
      timer: {
        container: document.getElementById('timer-display'),
        value: document.getElementById('timer-value'),
        toggle: document.getElementById('timer-toggle'),
        checkbox: document.getElementById('enable-timer')
      }
    },
    results: {
      quizName: document.getElementById('result-quiz-name'),
      score: document.getElementById('score'),
      totalQuestions: document.getElementById('total-questions'),
      message: document.getElementById('score-message'),
      summary: document.getElementById('answers-summary'),
      stats: {
        accuracy: document.getElementById('accuracy'),
        avgTime: document.getElementById('avg-time'),
        fastestAnswer: document.getElementById('fastest-answer'),
        slowestAnswer: document.getElementById('slowest-answer')
      },
      shareText: document.getElementById('share-text')
    },
    stats: {
      completionRate: document.getElementById('completion-rate'),
      completedQuizzes: document.getElementById('completed-quizzes'),
      totalQuizzes: document.getElementById('total-quizzes'),
      accuracy: document.getElementById('global-accuracy'),
      correctAnswers: document.getElementById('correct-answers'),
      totalAnswers: document.getElementById('total-answers'),
      avgTimePerQuestion: document.getElementById('avg-time-per-question'),
      themeBars: document.getElementById('themes-bars-container'),
      bestThemeName: document.getElementById('best-theme-name'),
      bestThemeAccuracy: document.getElementById('best-theme-accuracy'),
      worstThemeName: document.getElementById('worst-theme-name'),
      worstThemeAccuracy: document.getElementById('worst-theme-accuracy'),
      historyList: document.getElementById('quiz-history-list')
    },
    badges: {
      container: document.getElementById('badges-container'),
      list: document.getElementById('badges-list'),
      notification: document.getElementById('badges-notification')
    },
    buttons: {
      backToThemes: document.getElementById('back-to-themes'),
      backToQuizzes: document.getElementById('back-to-quizzes-btn'),
      showStats: document.getElementById('show-stats-btn'),
      showStatsFromQuiz: document.getElementById('show-stats-btn-from-quiz'),
      backFromStats: document.getElementById('back-from-stats'),
      resetProgress: document.getElementById('reset-progress'),
      prev: document.getElementById('prev-btn'),
      next: document.getElementById('next-btn'),
      submit: document.getElementById('submit-btn'),
      restart: document.getElementById('restart-btn'),
      export: document.getElementById('export-btn'),
      print: document.getElementById('print-btn'),
      copy: document.getElementById('copy-btn'),
      exitQuiz: document.getElementById('exit-quiz')
    },
    themeTitle: document.getElementById('theme-title'),
    themeDescription: document.getElementById('theme-description'),
    themesList: document.getElementById('themes-list'),
    quizzesList: document.getElementById('quizzes-list'),
    totalQuestionsCount: document.getElementById('total-questions-count'),
    totalThemesCount: document.getElementById('total-themes-count'),
    welcomeStatsPlaceholder: document.getElementById('welcome-stats-placeholder')
  };

  // Vérification des éléments DOM essentiels
  const requiredElements = [
    'screens.welcome', 'screens.quizSelection', 'screens.quiz', 'screens.result', 'screens.stats',
    'themesList', 'quizzesList', 'quiz.container'
  ];

  const missingElements = requiredElements.filter(path => {
    const element = getNestedProperty(DOM, path);
    return !element;
  });

  if (missingElements.length > 0) {
    Logger.error("Éléments DOM essentiels manquants:", missingElements);
    showErrorMessage("Une erreur est survenue lors du chargement de l'application. Veuillez rafraîchir la page.");
    return;
  }

  // Vérification de la disponibilité des modules requis
  if (!window.ResourceManager || !window.QuizManager || !window.QuizUI || !window.storage) {
    Logger.error("Modules requis manquants. Vérifiez le chargement des scripts.");
    showErrorMessage("Erreur de chargement des modules. Veuillez rafraîchir la page.");
    return;
  }

  // Initialisation des gestionnaires
  let quizManager, quizUI;
  
  try {
    quizManager = new window.QuizManager();
    quizUI = new window.QuizUI(quizManager, DOM, window.ResourceManager);
    
    // Configuration des event listeners
    quizUI.setupEventListeners();
    
    Logger.debug("Gestionnaires initialisés avec succès");
  } catch (error) {
    Logger.error("Erreur lors de l'initialisation des gestionnaires:", error);
    showErrorMessage("Erreur d'initialisation. Veuillez rafraîchir la page.");
    return;
  }

  // Initialisation des fonctionnalités de gamification
  initGamification(DOM);

  // Initialisation des utilitaires
  initUtilities(DOM);

  // Préchargement des métadonnées et démarrage de l'application
  startApplication(quizUI, DOM);

  Logger.log("Initialisation terminée - Application prête");
});

/**
 * Initialise le Service Worker avec gestion des mises à jour
 */
function initServiceWorker() {
  if (!window.TYF_CONFIG.serviceWorker.enabled || !('serviceWorker' in navigator)) {
    Logger.debug("Service Worker désactivé ou non supporté");
    return;
  }

  window.addEventListener('load', async function() {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      Logger.log('Service Worker enregistré:', registration.scope);

      // Gestion des mises à jour
      setupServiceWorkerUpdates(registration);

    } catch (error) {
      Logger.warn('Échec d\'enregistrement du Service Worker:', error);
    }
  });

  // Écouter les changements de contrôleur
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    Logger.log('Nouveau Service Worker actif - Rechargement...');
    window.location.reload();
  });
}

/**
 * Configure la gestion des mises à jour du Service Worker
 */
function setupServiceWorkerUpdates(registration) {
  // Vérifier s'il y a un worker en attente
  if (registration.waiting) {
    showUpdateNotification(registration.waiting);
  }

  // Écouter les nouveaux workers
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateNotification(newWorker);
      }
    });
  });

  // Vérification périodique des mises à jour
  if (window.TYF_CONFIG.serviceWorker.checkInterval > 0) {
    setInterval(() => {
      registration.update().catch(error => {
        Logger.debug('Vérification de mise à jour échouée:', error);
      });
    }, window.TYF_CONFIG.serviceWorker.checkInterval);
  }
}

/**
 * Affiche une notification de mise à jour disponible
 */
function showUpdateNotification(worker) {
  if (!window.TYF_CONFIG.serviceWorker.showUpdateNotifications) return;

  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <div class="update-icon">🔄</div>
      <div class="update-text">
        <h4>Mise à jour disponible</h4>
        <p>Une nouvelle version de l'application est prête.</p>
      </div>
      <div class="update-actions">
        <button id="update-btn" class="btn-primary">Mettre à jour</button>
        <button id="dismiss-btn" class="btn-secondary">Plus tard</button>
      </div>
    </div>
  `;

  // Styles inline pour éviter les dépendances CSS
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    padding: 16px; max-width: 300px; border-left: 4px solid #2196F3;
  `;

  document.body.appendChild(notification);

  // Gestionnaires d'événements
  notification.querySelector('#update-btn').addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    notification.remove();
  });

  notification.querySelector('#dismiss-btn').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-masquer après 10 secondes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

/**
 * Démarre l'application principale
 */
async function startApplication(quizUI, DOM) {
  try {
    Logger.debug("Chargement des métadonnées...");
    
    const metadata = await window.ResourceManager.loadMetadata();
    
    // Mettre à jour les compteurs globaux
    updateGlobalCounters(metadata, DOM);
    
    // Afficher l'écran d'accueil
    quizUI.showWelcomeScreen();
    
    Logger.log("Application démarrée avec succès");
    
  } catch (error) {
    Logger.error("Erreur lors du démarrage:", error);
    
    // Tentative de diagnostic automatique
    if (window.ResourceManager?.diagnose) {
      Logger.debug("Exécution du diagnostic...");
      await window.ResourceManager.diagnose();
    }
    
    showErrorMessage(
      `Impossible de charger les données de l'application. 
      Veuillez vérifier votre connexion et rafraîchir la page. 
      Détails: ${error.message}`
    );
  }
}

/**
 * Met à jour les compteurs globaux sur l'écran d'accueil
 */
function updateGlobalCounters(metadata, DOM) {
  if (!metadata?.themes) {
    Logger.warn("Métadonnées invalides pour les compteurs");
    setPlaceholderCounters(DOM);
    return;
  }

  try {
    // Nombre de thèmes
    if (DOM.totalThemesCount) {
      DOM.totalThemesCount.textContent = metadata.themes.length;
    }

    // Nombre total de questions estimé
    if (DOM.totalQuestionsCount) {
      let estimatedTotalQuestions = 0;
      metadata.themes.forEach(theme => {
        if (theme.quizzes && Array.isArray(theme.quizzes)) {
          estimatedTotalQuestions += theme.quizzes.length * 10; // 10 questions par quiz
        }
      });
      DOM.totalQuestionsCount.textContent = estimatedTotalQuestions;
    }

    // Nombre total de quiz
    if (DOM.stats.totalQuizzes) {
      let totalQuizzes = 0;
      metadata.themes.forEach(theme => {
        if (theme.quizzes && Array.isArray(theme.quizzes)) {
          totalQuizzes += theme.quizzes.length;
        }
      });
      DOM.stats.totalQuizzes.textContent = totalQuizzes;
    }

    Logger.debug("Compteurs globaux mis à jour:", {
      themes: metadata.themes.length,
      questions: DOM.totalQuestionsCount?.textContent,
      quizzes: DOM.stats.totalQuizzes?.textContent
    });

  } catch (error) {
    Logger.error("Erreur lors de la mise à jour des compteurs:", error);
    setPlaceholderCounters(DOM);
  }
}

/**
 * Définit des placeholders pour les compteurs en cas d'erreur
 */
function setPlaceholderCounters(DOM) {
  if (DOM.totalThemesCount) DOM.totalThemesCount.textContent = '...';
  if (DOM.totalQuestionsCount) DOM.totalQuestionsCount.textContent = '...';
  if (DOM.stats.totalQuizzes) DOM.stats.totalQuizzes.textContent = '...';
}

/**
 * Initialise les fonctionnalités de gamification
 */
function initGamification(DOM) {
  Logger.debug("Initialisation de la gamification");
  
  if (!DOM.badges.container) {
    Logger.warn("Container de badges non trouvé");
    return;
  }

  // Affichage des badges quand l'écran stats devient visible
  DOM.screens.stats.addEventListener('transitionend', (event) => {
    if (!DOM.screens.stats.classList.contains('hidden')) {
      loadAndDisplayBadges(DOM);
    }
  });

  // Écouter les notifications de nouveaux badges
  document.addEventListener('badgesEarned', (event) => {
    if (event.detail?.badges && Array.isArray(event.detail.badges)) {
      showBadgeNotification(event.detail.badges, DOM);
    }
  });
}

/**
 * Charge et affiche les badges utilisateur
 */
async function loadAndDisplayBadges(DOM) {
  try {
    const badges = await window.storage.getUserBadges();
    
    if (badges && badges.length > 0 && DOM.badges.list) {
      renderBadges(badges, DOM);
    } else if (DOM.badges.list) {
      DOM.badges.list.innerHTML = '<p class="no-data">Aucun badge obtenu pour le moment.</p>';
    }
    
    DOM.badges.container.classList.remove('hidden');
    
  } catch (error) {
    Logger.warn("Erreur lors du chargement des badges:", error);
    if (DOM.badges.list) {
      DOM.badges.list.innerHTML = '<p class="error-message">Impossible de charger les badges.</p>';
    }
    DOM.badges.container.classList.remove('hidden');
  }
}

/**
 * Initialise les utilitaires de l'application
 */
function initUtilities(DOM) {
  // Raccourcis clavier
  document.addEventListener('keydown', (event) => {
    // Échap pour fermer les notifications
    if (event.key === 'Escape') {
      const notifications = document.querySelectorAll('.update-notification, .badge-notification');
      notifications.forEach(notification => notification.remove());
    }
  });

  // Gestion du mode hors ligne
  window.addEventListener('online', () => {
    Logger.log("Connexion rétablie");
    showTemporaryMessage("Connexion rétablie", 'success');
  });

  window.addEventListener('offline', () => {
    Logger.log("Mode hors ligne activé");
    showTemporaryMessage("Mode hors ligne - Fonctionnalités limitées", 'warning');
  });
}

/**
 * Affiche un message temporaire
 */
function showTemporaryMessage(message, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.className = `temp-message temp-message-${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
    z-index: 9999; padding: 10px 20px; border-radius: 4px;
    color: white; font-weight: bold; opacity: 0; transition: opacity 0.3s;
    background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
  `;
  
  document.body.appendChild(messageEl);
  
  // Animation d'apparition
  requestAnimationFrame(() => {
    messageEl.style.opacity = '1';
  });
  
  // Suppression automatique
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => messageEl.remove(), 300);
  }, 3000);
}

/**
 * Renders the user's earned badges into the badge list DOM element.
 */
function renderBadges(badges, DOM) {
  const badgeListEl = DOM.badges.list;

  if (!badgeListEl) {
    Logger.error("Badge list DOM element not found.");
    return;
  }

  badgeListEl.innerHTML = '';

  if (!badges || badges.length === 0) {
    badgeListEl.innerHTML = '<p class="no-data">Aucun badge obtenu pour le moment.</p>';
    return;
  }

  badges.forEach(badge => {
    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge-item';

    const date = new Date(badge.dateEarned);
    const formattedDate = date.toLocaleDateString('fr-FR');

    badgeEl.innerHTML = `
      <div class="badge-icon"><i class="${badge.icon || 'fas fa-certificate'}"></i></div>
      <div class="badge-content">
        <div class="badge-name">${badge.name}</div>
        ${badge.description ? `<div class="badge-desc">${badge.description}</div>` : ''}
        <div class="badge-date">Obtenu le ${formattedDate}</div>
      </div>
    `;

    badgeListEl.appendChild(badgeEl);
  });
}

/**
 * Displays a notification popup for newly earned badges.
 */
function showBadgeNotification(newBadges, DOM) {
  const notificationEl = DOM.badges.notification;

  if (!notificationEl || !newBadges || newBadges.length === 0) {
    return;
  }

  // Construction du contenu de notification
  let notificationContent = `
    <div class="badge-notification-header">
      <i class="fas fa-trophy"></i>
      <h3>${newBadges.length > 1 ? 'Badges obtenus !' : 'Badge obtenu !'}</h3>
    </div>
    <div class="badge-notification-list">
  `;

  newBadges.forEach(badge => {
    notificationContent += `
      <div class="badge-notification-item">
        <i class="${badge.icon || 'fas fa-certificate'}"></i>
        <div class="badge-notification-details">
          <div class="badge-notification-name">${badge.name}</div>
          ${badge.description ? `<div class="badge-notification-desc">${badge.description}</div>` : ''}
        </div>
      </div>
    `;
  });

  notificationContent += `
    </div>
    <button class="close-notification" aria-label="Fermer la notification">Fermer</button>
  `;

  // Affichage de la notification
  notificationEl.innerHTML = notificationContent;
  notificationEl.classList.remove('hidden');

  // Bouton de fermeture
  const closeButton = notificationEl.querySelector('.close-notification');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      notificationEl.classList.add('hidden');
    });
  }

  // Masquage automatique
  const displayTime = Math.max(5000, newBadges.length * 2000);
  setTimeout(() => {
    if (!notificationEl.classList.contains('hidden')) {
      notificationEl.classList.add('hidden');
    }
  }, displayTime);

  // Mise à jour de la liste des badges après notification
  loadAndDisplayBadges(DOM);
}

/**
 * Displays a global error message to the user.
 */
function showErrorMessage(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'global-error-message';
  errorElement.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #f44336; color: white; padding: 15px; text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: sans-serif;
  `;
  
  errorElement.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <strong>⚠️ Erreur</strong><br>
      ${message}
      <button onclick="this.parentElement.parentElement.remove()" 
              style="margin-left: 10px; background: rgba(255,255,255,0.2); 
                     border: 1px solid white; color: white; padding: 5px 10px; 
                     border-radius: 3px; cursor: pointer;">
        Fermer
      </button>
    </div>
  `;
  
  document.body.appendChild(errorElement);
  Logger.error(message);

  // Suppression automatique après 10 secondes
  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.remove();
    }
  }, 10000);
}

/**
 * Utilitaire pour accéder aux propriétés imbriquées d'un objet
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}