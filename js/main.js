/*
 * js/data/main.js - Version 2.2.2 (Non-module)
 * Point d'entrée principal de l'application Test Your French
 */

// L'ordre de chargement des scripts est important:
// 1. resourceManager.js
// 2. storage.js
// 3. quizManager.js
// 4. ui.js
// 5. main.js (ce fichier)

// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation de l'application Test Your French v2.2.2 (Non-module version)");

  // Sélectionner tous les éléments DOM principaux
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

  // Vérifier que les éléments essentiels sont présents
  if (!DOM.screens.welcome || !DOM.screens.quizSelection || !DOM.screens.quiz || !DOM.screens.result || !DOM.screens.stats ||
      !DOM.themesList || !DOM.quizzesList || !DOM.quiz.container) {
    console.error("Éléments DOM essentiels manquants. Vérifiez le HTML et l'objet DOM.");
    showErrorMessage("Une erreur est survenue lors du chargement de l'application. Veuillez rafraîchir la page.");
    return;
  }

  // Initialiser les gestionnaires
  const quizManager = new window.QuizManager();
  const quizUI = new window.QuizUI(quizManager, DOM, window.ResourceManager);

  // Configure event listeners
  quizUI.setupEventListeners();

  // Initialiser les fonctionnalités de gamification
  initGamification(DOM);

  // Précharger les métadonnées des thèmes et démarrer l'application
  window.ResourceManager.loadMetadata()
    .then(metadata => {
      // Mettre à jour les compteurs globaux
      updateGlobalCounters(metadata, DOM);

      // Afficher l'écran d'accueil
      quizUI.showWelcomeScreen();
    })
    .catch(error => {
      console.error("Erreur lors du chargement des métadonnées:", error);
      showErrorMessage(`Impossible de charger les données de l'application. Veuillez vérifier votre connexion et rafraîchir la page. Détails: ${error.message}`);
    });

  console.log("Initialisation terminée - Prêt à démarrer");

  /**
   * Met à jour les compteurs globaux sur l'écran d'accueil
   * @param {Object} metadata - Métadonnées des thèmes
   * @param {Object} DOM - Référence à l'objet DOM
   */
  function updateGlobalCounters(metadata, DOM) {
    if (metadata && metadata.themes) {
      if (DOM.totalThemesCount) {
        DOM.totalThemesCount.textContent = metadata.themes.length;
      }

      if (DOM.totalQuestionsCount) {
        let estimatedTotalQuestions = 0;
        metadata.themes.forEach(theme => {
          // Ensure theme.quizzes exists before accessing length
          if (theme.quizzes && Array.isArray(theme.quizzes)) {
            estimatedTotalQuestions += theme.quizzes.length * 10; // Assumed 10 questions per quiz
          }
        });
        DOM.totalQuestionsCount.textContent = estimatedTotalQuestions;
      }

      // This totalQuizzes is used in stats screen
      if (DOM.stats.totalQuizzes) {
        let totalQuizzes = 0;
        metadata.themes.forEach(theme => {
           if (theme.quizzes && Array.isArray(theme.quizzes)) {
             totalQuizzes += theme.quizzes.length;
           }
        });
        DOM.stats.totalQuizzes.textContent = totalQuizzes;
      }
    } else {
      // Set placeholders if metadata is invalid
      if (DOM.totalThemesCount) DOM.totalThemesCount.textContent = '...';
      if (DOM.totalQuestionsCount) DOM.totalQuestionsCount.textContent = '...';
      if (DOM.stats.totalQuizzes) DOM.stats.totalQuizzes.textContent = '...';
    }
  }

  /**
   * Initialise les fonctionnalités de gamification.
   * @param {Object} DOM - Référence à l'objet DOM.
   */
  function initGamification(DOM) {
    console.log("Gamification initialized.");
    if (DOM.badges.container) {
      // When the stats screen is shown, trigger badge rendering
      DOM.screens.stats.addEventListener('transitionend', (event) => {
        if (!DOM.screens.stats.classList.contains('hidden')) {
          window.storage.getUserBadges().then(badges => {
            if (badges && badges.length > 0 && DOM.badges.list) {
              renderBadges(badges, DOM);
            } else if (DOM.badges.list) {
              DOM.badges.list.innerHTML = '<p class="no-data">No badges earned yet.</p>';
            }
            DOM.badges.container.classList.remove('hidden');
          }).catch(err => {
            console.warn("Erreur lors du chargement des badges pour affichage stats:", err);
            if (DOM.badges.list) DOM.badges.list.innerHTML = '<p class="error-message">Could not load badges.</p>';
            DOM.badges.container.classList.remove('hidden');
          });
        }
      });
    }

    // Listen for badge notifications
    document.addEventListener('badgesEarned', (event) => {
      if (event.detail && event.detail.badges && Array.isArray(event.detail.badges)) {
        showBadgeNotification(event.detail.badges, DOM);
      }
    });
  }

  /**
   * Renders the user's earned badges into the badge list DOM element.
   * @param {Array} badges - An array of badge objects.
   * @param {Object} DOM - Reference to the DOM elements object.
   */
  function renderBadges(badges, DOM) {
    const badgeListEl = DOM.badges.list;
    const badgeContainerEl = DOM.badges.container;

    if (!badgeListEl || !badgeContainerEl) {
      console.error("Badge list or container DOM element not found.");
      return;
    }

    badgeListEl.innerHTML = '';

    if (!badges || badges.length === 0) {
      badgeListEl.innerHTML = '<p class="no-data">No badges earned yet.</p>';
      return;
    }

    badges.forEach(badge => {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge-item';

      const date = new Date(badge.dateEarned);
      const formattedDate = date.toLocaleDateString();

      badgeEl.innerHTML = `
        <div class="badge-icon"><i class="${badge.icon || 'fas fa-certificate'}"></i></div>
        <div class="badge-content">
          <div class="badge-name">${badge.name}</div>
          ${badge.description ? `<div class="badge-desc">${badge.description}</div>` : ''}
          <div class="badge-date">Earned on ${formattedDate}</div>
        </div>
      `;

      badgeListEl.appendChild(badgeEl);
    });
  }

  /**
   * Displays a notification popup for newly earned badges.
   * @param {Array} newBadges - An array of the new badge objects earned.
   * @param {Object} DOM - Reference to the DOM elements object.
   */
  function showBadgeNotification(newBadges, DOM) {
    const notificationEl = DOM.badges.notification;

    if (!notificationEl || !newBadges || newBadges.length === 0) {
      return;
    }

    // Build the notification content
    let notificationContent = `
      <div class="badge-notification-header">
        <i class="fas fa-trophy"></i>
        <h3>${newBadges.length > 1 ? 'Badges Earned!' : 'Badge Earned!'}</h3>
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
       <button class="close-notification" aria-label="Fermer la notification">Close</button>
    `;

    // Show the notification
    notificationEl.innerHTML = notificationContent;
    notificationEl.classList.remove('hidden');

    // Add event listener to the close button within the notification
    const closeButton = notificationEl.querySelector('.close-notification');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notificationEl.classList.add('hidden');
      });
    }

    // Automatically hide the notification after a few seconds
    const displayTime = Math.max(5000, newBadges.length * 2000);
    setTimeout(() => {
      if (!notificationEl.classList.contains('hidden')) {
        notificationEl.classList.add('hidden');
      }
    }, displayTime);

    // After showing the notification, refresh the badge list on the stats screen
    window.storage.getUserBadges().then(allEarnedBadges => {
      if (DOM.badges.list) {
        renderBadges(allEarnedBadges, DOM);
      }
    }).catch(err => {
      console.warn("Error updating badge list after notification:", err);
    });
  }

  /**
   * Displays a global error message to the user.
   * @param {string} message - The error message to display.
   */
  function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;text-align:center;z-index:9999;';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    console.error(message);
  }
});