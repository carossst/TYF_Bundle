// js/main.js - Version 2.2.0 (11/04/2025)
// Point d'entrée principal de l'application Test Your French
// Initialise les modules, gère le chargement dynamique des données
// et configure les interactions utilisateur

import QuizManager from './quizManager.js';
import QuizUI from './ui.js';
import storage from './storage.js';
import resourceManager from './resourceManager.js';
import ThemeController from './themeController.js';

/**
 * Initialisation de l'application au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation de l'application Test Your French v2.2.0");
  
  // Sélectionner tous les éléments DOM principaux
  const DOM = {
    screens: {
      welcome: document.getElementById('welcome-screen'),
      themeSelection: document.getElementById('theme-selection'),
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
      exploreThemes: document.getElementById('explore-themes-btn'),
      backToWelcome: document.getElementById('back-to-welcome'),
      backToThemes: document.getElementById('back-to-themes'),
      backToQuizzes: document.getElementById('back-to-quizzes-btn'),
      showStats: document.getElementById('show-stats-btn'),
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
    welcomeStats: document.getElementById('welcome-stats')
  };

  // Vérifier que les éléments essentiels sont présents
  if (!DOM.screens.welcome || !DOM.screens.themeSelection || !DOM.quiz.container) {
    console.error("Éléments DOM essentiels manquants. Vérifiez le HTML.");
    alert("Une erreur est survenue lors du chargement de l'application. Veuillez rafraîchir la page.");
    return;
  }

  // Initialiser le gestionnaire de quiz
  const quizManager = new QuizManager();
  
  // Initialiser le contrôleur de thème
  const themeController = new ThemeController();
  
  // Initialiser l'interface utilisateur avec les gestionnaires et les éléments DOM
  const quizUI = new QuizUI(quizManager, DOM, themeController);
  
  // Précharger les métadonnées des thèmes
  resourceManager.loadMetadata()
    .then(metadata => {
      // Mettre à jour les compteurs globaux
      updateGlobalCounters(metadata);
      
      // Afficher les statistiques sur l'écran d'accueil si disponibles
      displayWelcomeStats();
  
      // Initialiser l'UI avec les thèmes chargés
      quizUI.initThemesView();
    })
    .catch(error => {
      console.error("Erreur lors du chargement des métadonnées:", error);
      // Afficher un message d'erreur à l'utilisateur
      showErrorMessage("Impossible de charger les données de l'application. Veuillez vérifier votre connexion et rafraîchir la page.");
    });
  
  // Définir les événements globaux
  setupGlobalEvents(quizUI);
  
  // Initialiser les fonctionnalités de gamification
  initGamification();
  
  // Animer les éléments avec la classe fade-in
  document.querySelectorAll('.fade-in').forEach(el => {
    el.addEventListener('animationend', () => {
      el.classList.remove('fade-in');
    }, { once: true });
  });
  
  console.log("Initialisation terminée - Prêt à démarrer");

  /**
   * Met à jour les compteurs globaux sur l'écran d'accueil
   * @param {Object} metadata - Métadonnées des thèmes
   */
  function updateGlobalCounters(metadata) {
    if (metadata && metadata.themes) {
      if (DOM.totalThemesCount) {
        DOM.totalThemesCount.textContent = metadata.themes.length;
      }
      
      if (DOM.totalQuestionsCount) {
        // Calculer le nombre total de questions d'après les métadonnées
        let estimatedTotalQuestions = 0;
        metadata.themes.forEach(theme => {
          if (theme.quizzes) {
            // Chaque quiz contient normalement 10 questions
            estimatedTotalQuestions += theme.quizzes.length * 10;
          }
        });
        
        DOM.totalQuestionsCount.textContent = estimatedTotalQuestions;
      }
      
      if (DOM.stats.totalQuizzes) {
        let totalQuizzes = 0;
        metadata.themes.forEach(theme => {
          if (theme.quizzes) {
            totalQuizzes += theme.quizzes.length;
          }
        });
        
        DOM.stats.totalQuizzes.textContent = totalQuizzes;
      }
    }
  }

  /**
   * Affiche les statistiques d'utilisation sur l'écran d'accueil
   */
  async function displayWelcomeStats() {
    try {
      const stats = await storage.getGlobalStats();
      const globalCompletion = await storage.getGlobalCompletionRate();
      const globalAccuracy = await storage.getGlobalAccuracy();
      
      if (stats && stats.data && stats.data.completedQuizzesSet && Object.keys(stats.data.completedQuizzesSet).length > 0 && DOM.welcomeStats) {
        DOM.welcomeStats.innerHTML = `
          <p>Welcome back! You've completed ${Object.keys(stats.data.completedQuizzesSet).length} quizzes (${globalCompletion}% of all quizzes).</p>
          <p>Your average accuracy: ${globalAccuracy}%</p>
        `;
        DOM.welcomeStats.classList.remove('hidden');
      }
    } catch (error) {
      console.warn("Erreur lors de l'affichage des statistiques d'accueil:", error);
      // Ne pas bloquer l'exécution pour cette erreur non critique
    }
  }

  /**
   * Configure les événements globaux de l'application
   * @param {Object} ui - Instance de l'interface utilisateur
   */
  function setupGlobalEvents(ui) {
    // Vérifier les mises à jour du service worker périodiquement
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      setInterval(() => {
        navigator.serviceWorker.controller.postMessage({
          action: 'checkForUpdates'
        });
      }, 3600000); // Toutes les heures
      
      // Précharger les fichiers audio communs
      navigator.serviceWorker.controller.postMessage({
        action: 'preloadAudio',
        urls: [
          'audio/TYF_Lead_6.mp3',
          'audio/TYF_Lead_7.mp3',
          'audio/TYF_Lead_80.mp3',
          'audio/TYF_Lead_Phone.mp3'
        ]
      });
    }
    
    // Événement pour la touche d'échappement (quitter le quiz)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !DOM.screens.quiz.classList.contains('hidden')) {
        ui.confirmExitQuiz();
      }
    });
    
    // Écouter les événements de badges gagnés
    document.addEventListener('badgesEarned', (event) => {
      if (event.detail && event.detail.badges) {
        showBadgeNotification(event.detail.badges);
      }
    });
    
    // Gestion du cache audio
    document.addEventListener('audioloaded', (event) => {
      if (event.detail && event.detail.src) {
        // Informer le Service Worker de mettre en cache ce fichier audio
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            action: 'cacheAudio',
            url: event.detail.src
          });
        }
      }
    });
  }
  
  /**
   * Initialise les fonctionnalités de gamification
   */
  function initGamification() {
    // Charger et afficher les badges si nécessaire
    storage.getUserBadges().then(badges => {
      if (badges && badges.length > 0 && DOM.badges.list) {
        renderBadges(badges);
      }
    }).catch(err => {
      console.warn("Erreur lors du chargement des badges:", err);
    });
  }
  
  /**
   * Affiche les badges dans l'interface
   * @param {Array} badges - Liste des badges à afficher
   */
  function renderBadges(badges) {
    if (!DOM.badges.list) return;
    
    DOM.badges.list.innerHTML = '';
    
    badges.forEach(badge => {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge-item';
      
      const date = new Date(badge.dateEarned);
      const formattedDate = date.toLocaleDateString();
      
      badgeEl.innerHTML = `
        <div class="badge-icon"><i class="${badge.icon}"></i></div>
        <div class="badge-content">
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${badge.description}</div>
          <div class="badge-date">Earned on ${formattedDate}</div>
        </div>
      `;
      
      DOM.badges.list.appendChild(badgeEl);
    });
    
    if (DOM.badges.container) {
      DOM.badges.container.classList.remove('hidden');
    }
  }
  
  /**
   * Affiche une notification de nouveaux badges gagnés
   * @param {Array} newBadges - Nouveaux badges gagnés
   */
  function showBadgeNotification(newBadges) {
    if (!DOM.badges.notification || !newBadges || newBadges.length === 0) return;
    
    // Créer le contenu de la notification
    let notificationContent = `
      <div class="badge-notification-header">
        <i class="fas fa-trophy"></i>
        <h3>Badges Earned!</h3>
      </div>
      <div class="badge-notification-list">
    `;
    
    newBadges.forEach(badge => {
      notificationContent += `
        <div class="badge-notification-item">
          <i class="${badge.icon}"></i>
          <div class="badge-notification-details">
            <div class="badge-notification-name">${badge.name}</div>
            <div class="badge-notification-desc">${badge.description}</div>
          </div>
        </div>
      `;
    });
    
    notificationContent += `
      </div>
      <button class="badge-notification-close">Close</button>
    `;
    
    // Afficher la notification
    DOM.badges.notification.innerHTML = notificationContent;
    DOM.badges.notification.classList.remove('hidden');
    
    // Fermer la notification lorsque le bouton est cliqué
    const closeButton = DOM.badges.notification.querySelector('.badge-notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        DOM.badges.notification.classList.add('hidden');
      });
    }
    
    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
      DOM.badges.notification.classList.add('hidden');
    }, 5000);
    
    // Mettre à jour l'affichage des badges
    storage.getUserBadges().then(badges => {
      if (badges && badges.length > 0) {
        renderBadges(badges);
      }
    }).catch(err => {
      console.warn("Erreur lors du chargement des badges après notification:", err);
    });
  }
  
  /**
   * Affiche un message d'erreur à l'utilisateur
   * @param {string} message - Message d'erreur à afficher
   */
  function showErrorMessage(message) {
    // Créer un élément de message d'erreur
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
        <button class="btn btn-secondary error-close">OK</button>
      </div>
    `;
    
    // Ajouter à la page
    document.body.appendChild(errorEl);
    
    // Fermer le message lorsque le bouton est cliqué
    const closeButton = errorEl.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        errorEl.remove();
      });
    }
  }
});
