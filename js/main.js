/*
 * js/main.js - Version 2.3.1 CORRIGÉE COMPLÈTE - GitHub Pages et DOM
 */

// Configuration globale de l'application  
window.TYF_CONFIG = {
  version: '2.3.1',
  environment: detectEnvironment(),
  
  serviceWorker: {
    enabled: true,
    autoUpdate: false,
    showUpdateNotifications: true,
    checkInterval: 60000
  },
  
  debug: {
    enabled: detectEnvironment() === 'development',
    logLevel: detectEnvironment() === 'development' ? 'debug' : 'warn'
  }
};

function detectEnvironment() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  if (hostname.includes('github.io')) return 'github-pages';
  return 'production';
}

const Logger = {
  debug: (...args) => window.TYF_CONFIG.debug.enabled && console.log('[TYF Debug]', ...args),
  log: (...args) => console.log('[TYF]', ...args),
  warn: (...args) => console.warn('[TYF Warning]', ...args),
  error: (...args) => console.error('[TYF Error]', ...args)
};

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

document.addEventListener('DOMContentLoaded', function() {
  Logger.log(`Initialisation de l'application Test Your French v${window.TYF_CONFIG.version} (${window.TYF_CONFIG.environment})`);

  initServiceWorker();

  // 🔧 CORRECTION MAJEURE - DOM complet et cohérent
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
      score: document.getElementById('final-score'),
      totalQuestions: document.getElementById('total-questions'),
      message: document.getElementById('score-message'),
      summary: document.getElementById('answers-summary'),
      shareText: document.getElementById('share-text')
    },
    stats: {
      completedQuizzes: document.getElementById('stats-quizzes-completed'),
      totalQuizzes: document.getElementById('total-quizzes'),
      accuracy: document.getElementById('stats-average-score'),
      correctAnswers: document.getElementById('stats-questions-correct'),
      totalAnswers: document.getElementById('total-answers'),
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
      showStats: document.getElementById('show-stats-btn'),
      showStatsFromQuiz: document.getElementById('show-stats-btn-from-quiz'),
      backFromStats: document.getElementById('back-to-themes-from-stats'),
      prev: document.getElementById('prev-btn'),
      next: document.getElementById('next-btn'),
      submit: document.getElementById('submit-btn'),
      copy: document.getElementById('copy-btn'),
      exitQuiz: document.getElementById('exit-quiz')
    },
    themeTitle: document.getElementById('theme-title'),
    themeDescription: document.getElementById('theme-description'),
    themesList: document.getElementById('themes-list'),
    quizzesList: document.getElementById('quizzes-list'),
    totalQuestionsCount: document.getElementById('total-questions-count'),
    totalThemesCount: document.getElementById('total-themes-count'),
    
    // 🆕 Stats dashboard accueil
    welcomeStats: {
      container: document.getElementById('welcome-stats-summary'),
      quizzesCompleted: document.getElementById('welcome-quizzes-completed'),
      accuracy: document.getElementById('welcome-accuracy'),
      themesProgress: document.getElementById('welcome-themes-progress'),
      streak: document.getElementById('welcome-streak')
    }
  };

  // 🔧 VÉRIFICATION CRITIQUE - Seulement les éléments essentiels
  const requiredElements = [
    'screens.welcome', 'screens.quizSelection', 'screens.quiz', 'screens.result', 'screens.stats',
    'themesList', 'quizzesList', 'quiz.container', 'quiz.feedback'
  ];

  const missingElements = requiredElements.filter(path => {
    const element = getNestedProperty(DOM, path);
    if (!element) {
      Logger.error(`Missing required DOM element: ${path}`);
      return true;
    }
    return false;
  });

  if (missingElements.length > 0) {
    Logger.error("Éléments DOM essentiels manquants:", missingElements);
    showErrorMessage("Une erreur est survenue lors du chargement de l'application. Veuillez rafraîchir la page.");
    return;
  }

  // 🔧 CORRECTION - Vérification modules AVANT utilisation
  if (!window.ResourceManager || !window.QuizManager || !window.QuizUI || !window.storage) {
    Logger.error("Modules requis manquants. Vérifiez le chargement des scripts.");
    showErrorMessage("Erreur de chargement des modules. Veuillez rafraîchir la page.");
    return;
  }

  let quizManager, quizUI;
  
  try {
    quizManager = new window.QuizManager();
    quizUI = new window.QuizUI(quizManager, DOM, window.ResourceManager);
    
    quizUI.setupEventListeners();
    
    Logger.debug("Gestionnaires initialisés avec succès");
  } catch (error) {
    Logger.error("Erreur lors de l'initialisation des gestionnaires:", error);
    showErrorMessage("Erreur d'initialisation. Veuillez rafraîchir la page.");
    return;
  }

  initGamification(DOM);
  initUtilities(DOM);
  startApplication(quizUI, DOM);

  Logger.log("Initialisation terminée - Application prête");
});

// 🔧 CORRECTION SERVICE WORKER - GitHub Pages optimisé
function initServiceWorker() {
  if (!window.TYF_CONFIG.serviceWorker.enabled || !('serviceWorker' in navigator)) {
    Logger.debug("Service Worker désactivé ou non supporté");
    return;
  }

  window.addEventListener('load', async function() {
    try {
      // 🔧 CORRECTION - Chemin Service Worker cohérent
      const swPath = window.TYF_CONFIG.environment === 'github-pages' ? '/TYF_Bundle/sw.js' : './sw.js';
      const registration = await navigator.serviceWorker.register(swPath);
      Logger.log('Service Worker enregistré:', registration.scope);

      setupServiceWorkerUpdates(registration);

    } catch (error) {
      Logger.warn('Échec d\'enregistrement du Service Worker:', error);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    Logger.log('Nouveau Service Worker actif - Rechargement...');
    window.location.reload();
  });
}

function setupServiceWorkerUpdates(registration) {
  if (registration.waiting) {
    showUpdateNotification(registration.waiting);
  }

  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateNotification(newWorker);
      }
    });
  });

  if (window.TYF_CONFIG.serviceWorker.checkInterval > 0) {
    setInterval(() => {
      registration.update().catch(error => {
        Logger.debug('Vérification de mise à jour échouée:', error);
      });
    }, window.TYF_CONFIG.serviceWorker.checkInterval);
  }
}

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

  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    padding: 16px; max-width: 300px; border-left: 4px solid #2196F3;
  `;

  document.body.appendChild(notification);

  notification.querySelector('#update-btn').addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    notification.remove();
  });

  notification.querySelector('#dismiss-btn').addEventListener('click', () => {
    notification.remove();
  });

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

async function startApplication(quizUI, DOM) {
  try {
    Logger.debug("Chargement des métadonnées...");
    
    // 🔧 CORRECTION - Diagnostic si échec
    const metadata = await window.ResourceManager.loadMetadata();
    
    updateGlobalCounters(metadata, DOM);
    
    quizUI.showWelcomeScreen();
    
    Logger.log("Application démarrée avec succès");
    
  } catch (error) {
    Logger.error("Erreur lors du démarrage:", error);
    
    // 🔧 DIAGNOSTIC AUTO si erreur
    if (window.ResourceManager?.diagnose) {
      Logger.debug("Exécution du diagnostic automatique...");
      await window.ResourceManager.diagnose();
    }
    
    showErrorMessage(
      `Impossible de charger les données de l'application. 
      Vérifiez que le fichier metadata.json existe dans js/data/. 
      Détails: ${error.message}`
    );
  }
}

function updateGlobalCounters(metadata, DOM) {
  if (!metadata?.themes) {
    Logger.warn("Métadonnées invalides pour les compteurs");
    setPlaceholderCounters(DOM);
    return;
  }

  try {
    if (DOM.totalThemesCount) {
      DOM.totalThemesCount.textContent = metadata.themes.length;
    }

    if (DOM.totalQuestionsCount) {
      let estimatedTotalQuestions = 0;
      metadata.themes.forEach(theme => {
        if (theme.quizzes && Array.isArray(theme.quizzes)) {
          estimatedTotalQuestions += theme.quizzes.length * 10; // ~10 questions par quiz
        }
      });
      DOM.totalQuestionsCount.textContent = estimatedTotalQuestions;
    }

    Logger.debug("Compteurs globaux mis à jour:", {
      themes: metadata.themes.length,
      estimatedQuestions: DOM.totalQuestionsCount?.textContent
    });

  } catch (error) {
    Logger.error("Erreur lors de la mise à jour des compteurs:", error);
    setPlaceholderCounters(DOM);
  }
}

function setPlaceholderCounters(DOM) {
  if (DOM.totalThemesCount) DOM.totalThemesCount.textContent = '...';
  if (DOM.totalQuestionsCount) DOM.totalQuestionsCount.textContent = '...';
}

function initGamification(DOM) {
  Logger.debug("Initialisation de la gamification");
  
  if (!DOM.badges?.container) {
    Logger.debug("Container de badges non trouvé - gamification désactivée");
    return;
  }

  const statsScreen = DOM.screens.stats;
  if (statsScreen) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (!statsScreen.classList.contains('hidden')) {
            loadAndDisplayBadges(DOM);
          }
        }
      });
    });
    
    observer.observe(statsScreen, { attributes: true });
  }

  document.addEventListener('badgesEarned', (event) => {
    if (event.detail?.badges && Array.isArray(event.detail.badges)) {
      showBadgeNotification(event.detail.badges, DOM);
    }
  });
}

async function loadAndDisplayBadges(DOM) {
  if (!DOM.badges?.list) {
    Logger.debug("Badge list element not found");
    return;
  }

  try {
    const badges = await window.storage.getUserBadges();
    
    if (badges && badges.length > 0) {
      renderBadges(badges, DOM);
    } else {
      DOM.badges.list.innerHTML = '<p class="no-data">Aucun badge obtenu pour le moment.</p>';
    }
    
    if (DOM.badges.container) {
      DOM.badges.container.classList.remove('hidden');
    }
    
  } catch (error) {
    Logger.warn("Erreur lors du chargement des badges:", error);
    if (DOM.badges.list) {
      DOM.badges.list.innerHTML = '<p class="error-message">Impossible de charger les badges.</p>';
    }
  }
}

function initUtilities(DOM) {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const notifications = document.querySelectorAll('.update-notification, .badge-notification');
      notifications.forEach(notification => notification.remove());
    }
  });

  window.addEventListener('online', () => {
    Logger.log("Connexion rétablie");
    showTemporaryMessage("Connexion rétablie", 'success');
  });

  window.addEventListener('offline', () => {
    Logger.log("Mode hors ligne activé");
    showTemporaryMessage("Mode hors ligne - Fonctionnalités limitées", 'warning');
  });
}

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
  
  requestAnimationFrame(() => {
    messageEl.style.opacity = '1';
  });
  
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => messageEl.remove(), 300);
  }, 3000);
}

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

function showBadgeNotification(newBadges, DOM) {
  const notificationEl = DOM.badges.notification;

  if (!notificationEl || !newBadges || newBadges.length === 0) {
    return;
  }

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

  notificationEl.innerHTML = notificationContent;
  notificationEl.classList.remove('hidden');

  const closeButton = notificationEl.querySelector('.close-notification');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      notificationEl.classList.add('hidden');
    });
  }

  const displayTime = Math.max(5000, newBadges.length * 2000);
  setTimeout(() => {
    if (!notificationEl.classList.contains('hidden')) {
      notificationEl.classList.add('hidden');
    }
  }, displayTime);

  loadAndDisplayBadges(DOM);
}

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

  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.remove();
    }
  }, 10000);
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}