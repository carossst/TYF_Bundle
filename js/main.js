// main.js - Version corrigée pour éviter les problèmes CSP
// Import direct des modules nécessaires (adapter selon votre structure de dossiers)

// Note: Assurez-vous que les chemins d'importation correspondent à vos dossiers réels
import QuizManager from './quizManager.js';
import QuizUI from './ui.js';
import storage from './storage.js';
import resourceManager from './resourceManager.js';

/**
 * Initialisation de l'application au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation de l'application Test Your French v2.2.1");

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
    // Le reste de votre mappage DOM reste inchangé
    // ...
    
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
  const quizManager = new QuizManager();
  const quizUI = new QuizUI(quizManager, DOM, resourceManager);

  // Configure event listeners
  quizUI.setupEventListeners();

  // Initialiser les fonctionnalités de gamification
  initGamification(DOM);

  // Précharger les métadonnées des thèmes et démarrer l'application
  resourceManager.loadMetadata()
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

  // Utilitaire pour afficher des erreurs
  function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;text-align:center;z-index:9999;';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    
    // Afficher aussi dans la console
    console.error(message);
  }

  // Met à jour les compteurs globaux sur l'écran d'accueil
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

      // Update totalQuizzes in stats screen
      if (DOM.stats && DOM.stats.totalQuizzes) {
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
      if (DOM.stats && DOM.stats.totalQuizzes) DOM.stats.totalQuizzes.textContent = '...';
    }
  }

  // Fonction pour initialiser la gamification (badges)
  function initGamification(DOM) {
    console.log("Gamification initialized.");
    // Attachez les écouteurs d'événements nécessaires
    document.addEventListener('badgesEarned', (event) => {
      if (event.detail && event.detail.badges && Array.isArray(event.detail.badges)) {
        showBadgeNotification(event.detail.badges, DOM);
      }
    });
  }

  // Affiche une notification de badge
  function showBadgeNotification(newBadges, DOM) {
    const notificationEl = DOM.badges && DOM.badges.notification;
    if (!notificationEl || !newBadges || newBadges.length === 0) return;

    // Créer le contenu de la notification
    let content = `
      <div class="badge-notification-header">
        <i class="fas fa-trophy"></i>
        <h3>${newBadges.length > 1 ? 'Badges Earned!' : 'Badge Earned!'}</h3>
      </div>
      <div class="badge-notification-list">
    `;
    
    newBadges.forEach(badge => {
      content += `
        <div class="badge-notification-item">
          <i class="${badge.icon || 'fas fa-certificate'}"></i>
          <div class="badge-notification-details">
            <div class="badge-notification-name">${badge.name}</div>
            ${badge.description ? `<div class="badge-notification-desc">${badge.description}</div>` : ''}
          </div>
        </div>
      `;
    });
    
    content += `
      </div>
      <button class="close-notification" aria-label="Fermer la notification">Close</button>
    `;
    
    notificationEl.innerHTML = content;
    notificationEl.classList.remove('hidden');
    
    // Ajouter un écouteur pour fermer
    const closeButton = notificationEl.querySelector('.close-notification');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notificationEl.classList.add('hidden');
      });
    }
    
    // Cacher automatiquement après un délai
    setTimeout(() => {
      if (!notificationEl.classList.contains('hidden')) {
        notificationEl.classList.add('hidden');
      }
    }, 5000 + (newBadges.length * 1000));
  }

  console.log("Initialisation terminée - Prêt à démarrer");
});