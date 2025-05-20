// js/main.js - Version 2.2.0 (12/04/2024) - Corrected Full Version
// Point d'entrée principal de l'application Test Your French
// Initialise les modules, gère le chargement dynamique des données
// et configure les interactions utilisateur

import QuizManager from './quizManager.js';
import QuizUI from './ui.js';
import storage from './storage.js';
import resourceManager from './resourceManager.js';
// ThemeController import is commented out as its role is largely covered by ResourceManager and UI in this version
// import ThemeController from './themeController.js';


/**
 * Initialisation de l'application au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation de l'application Test Your French v2.2.0");

  // Sélectionner tous les éléments DOM principaux
  const DOM = {
    screens: {
      welcome: document.getElementById('welcome-screen'),
      // themeSelection: Removed, merged into welcome
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
        checkbox: document.getElementById('enable-timer') // Reference to the timer checkbox on welcome screen
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
      totalQuizzes: document.getElementById('total-quizzes'), // Global count used in stats screen
      accuracy: document.getElementById('global-accuracy'),
      correctAnswers: document.getElementById('correct-answers'),
      totalAnswers: document.getElementById('total-answers'),
      avgTimePerQuestion: document.getElementById('avg-time-per-question'),
      themeBars: document.getElementById('themes-bars-container'), // Container for theme performance bars
      bestThemeName: document.getElementById('best-theme-name'),
      bestThemeAccuracy: document.getElementById('best-theme-accuracy'),
      worstThemeName: document.getElementById('worst-theme-name'),
      worstThemeAccuracy: document.getElementById('worst-theme-accuracy'),
      historyList: document.getElementById('quiz-history-list') // Container for recent history
    },
    badges: {
      container: document.getElementById('badges-container'), // Container for badge list
      list: document.getElementById('badges-list'), // List of badges
      notification: document.getElementById('badges-notification') // Notification popup
    },
    buttons: {
      // exploreThemes: Removed from HTML and DOM map
      // backToWelcome: document.getElementById('back-to-welcome'), // Appears unused in this flow
      backToThemes: document.getElementById('back-to-themes'), // Button on quiz-selection screen -> goes back to welcome
      backToQuizzes: document.getElementById('back-to-quizzes-btn'), // Button on result screen -> goes back to quiz-selection
      showStats: document.getElementById('show-stats-btn'), // Button on welcome screen -> goes to stats
      showStatsFromQuiz: document.getElementById('show-stats-btn-from-quiz'), // Button on quiz-selection screen -> goes to stats (new ID recommended)
      backFromStats: document.getElementById('back-from-stats'), // Button on stats screen -> goes back to welcome
      resetProgress: document.getElementById('reset-progress'), // Button on stats screen
      prev: document.getElementById('prev-btn'), // Button on quiz screen
      next: document.getElementById('next-btn'), // Button on quiz screen
      submit: document.getElementById('submit-btn'), // Button on quiz screen
      restart: document.getElementById('restart-btn'), // Button on result screen
      export: document.getElementById('export-btn'), // Button on result screen
      print: document.getElementById('print-btn'), // Button on result screen
      copy: document.getElementById('copy-btn'), // Button on result screen
      exitQuiz: document.getElementById('exit-quiz') // Button on quiz screen
    },
    themeTitle: document.getElementById('theme-title'), // Title on quiz-selection screen
    themeDescription: document.getElementById('theme-description'), // Description on quiz-selection screen
    themesList: document.getElementById('themes-list'), // Container for themes on welcome screen
    quizzesList: document.getElementById('quizzes-list'), // Container for quizzes on quiz-selection screen
    totalQuestionsCount: document.getElementById('total-questions-count'), // Global counter placeholder on welcome
    totalThemesCount: document.getElementById('total-themes-count'), // Global counter placeholder on welcome
    welcomeStatsPlaceholder: document.getElementById('welcome-stats-placeholder') // Placeholder for dynamic stats summary on welcome
  };

  // Vérifier que les éléments essentiels sont présents
  // Adjusted checks based on the new merged welcome screen structure
  if (!DOM.screens.welcome || !DOM.screens.quizSelection || !DOM.screens.quiz || !DOM.screens.result || !DOM.screens.stats ||
      !DOM.themesList || !DOM.quizzesList || !DOM.quiz.container) {
    console.error("Éléments DOM essentiels manquants. Vérifiez le HTML et l'objet DOM.");
    alert("Une erreur est survenue lors du chargement de l'application. Veuillez rafraîchir la page.");
    return;
  }

  // Initialiser les gestionnaires
  const quizManager = new QuizManager();
  // ThemeController might not be needed if UI uses ResourceManager directly for lists/info
  // const themeController = new ThemeController(); // Keep if ThemeController logic is valuable beyond ResourceManager
  const quizUI = new QuizUI(quizManager, DOM, resourceManager); // Pass resourceManager instance

  // Configure event listeners BEFORE loading data, so elements are reactive when rendered
  quizUI.setupEventListeners();

  // Initialiser les fonctionnalités de gamification (chargement initial des badges)
  // Pass DOM object to the gamification initialization
  initGamification(DOM);

  // Précharger les métadonnées des thèmes et démarrer l'application
  resourceManager.loadMetadata()
    .then(metadata => {
      // Mettre à jour les compteurs globaux sur l'écran d'accueil (requires metadata)
      updateGlobalCounters(metadata, DOM); // Pass DOM object

      // L'UI gère maintenant l'affichage des thèmes et des stats d'accueil dans initializeWelcomeScreen
      // Appel simple pour afficher l'écran d'accueil et déclencher sa logique interne
      quizUI.showWelcomeScreen();
    })
    .catch(error => {
      console.error("Erreur lors du chargement des métadonnées:", error);
      // Afficher un message d'erreur global à l'utilisateur via l'UI
       quizUI.showGlobalError(`Impossible de charger les données de l'application. Veuillez vérifier votre connexion et rafraîchir la page. Détails: ${error.message}`);
      // Attempt to show a minimal welcome screen even on failure
      // quizUI.showWelcomeScreen(); // initializeWelcomeScreen will handle showing errors in themesList
    });


  console.log("Initialisation terminée - Prêt à démarrer");


  /**
   * Met à jour les compteurs globaux sur l'écran d'accueil
   * @param {Object} metadata - Métadonnées des thèmes
   * @param {Object} DOM - Référence à l'objet DOM
   */
  function updateGlobalCounters(metadata, DOM) { // Added DOM parameter
    if (metadata && metadata.themes) {
      if (DOM.totalThemesCount) {
        DOM.totalThemesCount.textContent = metadata.themes.length;
      }

      if (DOM.totalQuestionsCount) {
        let estimatedTotalQuestions = 0;
        metadata.themes.forEach(theme => {
          // Ensure theme.quizzes exists before accessing length
          if (theme.quizzes && Array.isArray(theme.quizzes)) {
            estimatedTotalQuestions += theme.quizzes.length * 10; // Assumed 10 questions per quiz if not specified
          }
        });
        DOM.totalQuestionsCount.textContent = estimatedTotalQuestions;
      }

       // This totalQuizzes is used in stats screen, not welcome. Update it here too.
      if (DOM.stats.totalQuizzes) {
        let totalQuizzes = 0;
        metadata.themes.forEach(theme => {
           // Ensure theme.quizzes exists before accessing length
           if (theme.quizzes && Array.isArray(theme.quizzes)) {
             totalQuizzes += theme.quizzes.length;
           }
        });
        DOM.stats.totalQuizzes.textContent = totalQuizzes;
      }
    } else {
         // Set placeholders to default if metadata is invalid or missing
         if (DOM.totalThemesCount) DOM.totalThemesCount.textContent = '...';
         if (DOM.totalQuestionsCount) DOM.totalQuestionsCount.textContent = '...';
         if (DOM.stats.totalQuizzes) DOM.stats.totalQuizzes.textContent = '...';
    }
  }

  /**
   * Configures global events for the application.
   * @param {Object} ui - Instance of the UI.
   */
  function setupGlobalEvents(ui) { // Passed ui instance
    // Service Worker checks and messages
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Periodically check for updates (e.g., every hour)
      setInterval(() => {
        navigator.serviceWorker.controller.postMessage({ action: 'checkForUpdates' });
      }, 3600000); // 1 hour

      // Listen for messages from the Service Worker (e.g., update available)
      navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'update-available') {
              console.log('SW Update available.');
              // You could show an update notification to the user here
              // For example: showUpdateNotification();
          }
          // Handle other messages if needed
      });

       // Inform SW to cache audio files when they are loaded/played
       document.addEventListener('audioloaded', (event) => {
         if (event.detail && event.detail.src) {
           navigator.serviceWorker.controller.postMessage({ action: 'cacheAudio', url: event.detail.src });
         }
       });
        document.addEventListener('audioplay', (event) => { // Also cache on play
          if (event.detail && event.detail.src) {
            navigator.serviceWorker.controller.postMessage({ action: 'cacheAudio', url: event.detail.src });
          }
        });
    }


    // Global Escape key listener to exit quiz
    document.addEventListener('keydown', (e) => {
      // Check if we are on the quiz screen and not in a modal or input field
      if (e.key === 'Escape' && !DOM.screens.quiz.classList.contains('hidden') &&
          !e.target.tagName.match(/INPUT|TEXTAREA|SELECT|BUTTON/)) {
        e.preventDefault(); // Prevent default Escape behavior (like closing dialogs)
        ui.confirmExitQuiz(); // Use UI method to handle confirmation and navigation
      }
    });

    // Listen for custom events dispatched by storage.js when badges are earned
    document.addEventListener('badgesEarned', (event) => {
      if (event.detail && event.detail.badges && Array.isArray(event.detail.badges)) {
        showBadgeNotification(event.detail.badges, DOM); // Use utility function defined below
      }
    });

  }

  /**
   * Initialise les fonctionnalités de gamification (chargement initial des badges).
   * @param {Object} DOM - Référence à l'objet DOM.
   */
  function initGamification(DOM) { // Added DOM parameter
    // Load and display badges on the stats screen when it's shown (handled by renderStatsScreen in UI)
    // This function can be used for initial loading or other badge-related setup if needed.
    // For now, it primarily ensures the badge list area exists in DOM.
     console.log("Gamification initialized.");
     // You could potentially load and display a summary on the welcome screen here too
     // Or set up an event listener for the stats screen to trigger badge rendering
     if (DOM.badges.container) {
        // When the stats screen is shown, trigger badge rendering
         DOM.screens.stats.addEventListener('transitionend', (event) => {
             if (!DOM.screens.stats.classList.contains('hidden')) {
                  // Stats screen is visible, render badges
                  storage.getUserBadges().then(badges => {
                      if (badges && badges.length > 0 && DOM.badges.list) {
                          renderBadges(badges, DOM);
                      } else if (DOM.badges.list) {
                         // Clear list and hide container if no badges
                         DOM.badges.list.innerHTML = '<p class="no-data">No badges earned yet.</p>';
                         // DOM.badges.container.classList.add('hidden'); // Optional: hide the whole container
                      }
                       // Ensure container is visible if it wasn't
                      DOM.badges.container.classList.remove('hidden');
                  }).catch(err => {
                      console.warn("Erreur lors du chargement des badges pour affichage stats:", err);
                       if (DOM.badges.list) DOM.badges.list.innerHTML = '<p class="error-message">Could not load badges.</p>';
                       DOM.badges.container.classList.remove('hidden'); // Still show the container with error
                  });
             }
         });
     }
  }


  /**
   * Renders the user's earned badges into the badge list DOM element.
   * @param {Array} badges - An array of badge objects.
   * @param {Object} DOM - Reference to the DOM elements object.
   */
  function renderBadges(badges, DOM) { // Added DOM parameter
    const badgeListEl = DOM.badges.list;
    const badgeContainerEl = DOM.badges.container;

    if (!badgeListEl || !badgeContainerEl) {
        console.error("Badge list or container DOM element not found.");
        return;
    }

    badgeListEl.innerHTML = ''; // Clear existing list

    if (!badges || badges.length === 0) {
      badgeListEl.innerHTML = '<p class="no-data">No badges earned yet.</p>';
      // badgeContainerEl.classList.add('hidden'); // Optional: hide container if empty
      return;
    }

    // badgeContainerEl.classList.remove('hidden'); // Ensure container is visible if badges exist

    badges.forEach(badge => {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge-item'; // Use the CSS class

      const date = new Date(badge.dateEarned);
      // Use localeCompare for potentially better formatting
      const formattedDate = date.toLocaleDateString(); // e.g., 12/04/2024 or 4/12/2024
      // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 10:30 AM

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
  function showBadgeNotification(newBadges, DOM) { // Added DOM parameter
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
       <button class="close-notification" aria-label="Fermer la notification">Close</button> <!-- Close button inside -->
    `;

    // Show the notification
    notificationEl.innerHTML = notificationContent;
    notificationEl.classList.remove('hidden'); // Make it visible

    // Add event listener to the close button within the notification
    const closeButton = notificationEl.querySelector('.close-notification');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notificationEl.classList.add('hidden'); // Hide notification on click
      });
    }

    // Automatically hide the notification after a few seconds
    const displayTime = Math.max(5000, newBadges.length * 2000); // Minimum 5s, add time per badge
    setTimeout(() => {
       if (!notificationEl.classList.contains('hidden')) { // Only hide if user hasn't closed it
           notificationEl.classList.add('hidden');
       }
    }, displayTime);

    // After showing the notification, refresh the badge list on the stats screen
    // This ensures the stats screen is up-to-date if the user navigates there
     storage.getUserBadges().then(allEarnedBadges => {
         if (DOM.badges.list) { // Check if the badge list element exists in the DOM (it does on stats screen)
             renderBadges(allEarnedBadges, DOM); // Re-render the full list of badges
         }
     }).catch(err => {
         console.warn("Error updating badge list after notification:", err);
     });
  }

  /**
   * Displays a global error message to the user (simple alert fallback).
   * This is a utility function used for critical errors, like failed metadata load.
   * The UI class also has specific _showError methods for container elements.
   * @param {string} message - The error message to display.
   */
   function showErrorMessage(message) {
       // Create a simple overlay or use alert. Using alert as a simple fallback mechanism.
       alert(`Error: ${message}`);
        // A more complex implementation would create a modal or fixed banner.
        /* Example of a modal approach:
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'global-error-overlay'; // Need CSS for this
        errorOverlay.innerHTML = `
            <div class="global-error-content">
                <p>${message}</p>
                <button class="close-global-error">OK</button>
            </div>
        `;
        document.body.appendChild(errorOverlay);
        errorOverlay.querySelector('.close-global-error').addEventListener('click', () => errorOverlay.remove());
        */
   }

   // The showGlobalError method in the UI class uses `alert` by default,
   // which is consistent with this simple utility function.
   // We can choose to centralize global error display in the UI class
   // or keep this utility function in main.js if needed by other main logic.
   // For consistency with how UI uses it, let's remove the local showErrorMessage
   // and rely on quizUI.showGlobalError().
   // REMOVED: showErrorMessage function definition here.
   // The catch block in loadMetadata will call quizUI.showGlobalError().

});