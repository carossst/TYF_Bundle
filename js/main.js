// main.js - Fichier d'entrée mis à jour pour afficher directement les thèmes depuis l'accueil
import QuizManager from './quizManager.js';
import QuizUI from './ui.js';
import storage from './storage.js';
import resourceManager from './resourceManager.js';

document.addEventListener('DOMContentLoaded', function () {
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

  if (!DOM.screens.welcome || !DOM.quiz.container || !DOM.themesList || !DOM.quizzesList || !DOM.screens.stats) {
    alert("Erreur de chargement : certains éléments sont manquants.");
    return;
  }

  const quizManager = new QuizManager();
  const quizUI = new QuizUI(quizManager, DOM, resourceManager);

  quizUI.setupEventListeners();

  resourceManager.loadMetadata()
    .then(metadata => {
      quizUI.showWelcomeScreen();
    })
    .catch(error => {
      console.error("Erreur de chargement des données :", error);
      quizUI.showWelcomeScreen(); // fallback minimal
    });
});