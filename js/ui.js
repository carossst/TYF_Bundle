/*
 * ui.js – Version 2.3.1 NETTOYÉE - Duplication audio supprimée
 */
console.log("QuizUI initialized (Version 2.3.1 - NETTOYÉE)");

window.QuizUI = function(quizManager, domElements, resourceManagerInstance) {
  if (!quizManager || !domElements || !resourceManagerInstance) {
    throw new Error("QuizManager, DOM elements, and ResourceManager are required for QuizUI.");
  }

  this.quizManager = quizManager;
  this.dom = domElements;
  this.resourceManager = resourceManagerInstance;
  this.themeIndexCache = null;
  this.timerInterval = null;
  this.lastResults = null;
  this.feedbackTimeout = null;
  this.themeProgress = {}; // Track progress per theme
};

// 🧹 SUPPRIMÉ : getThemeAudioFolder() - utilise maintenant resourceManager.getAudioPath()

QuizUI.prototype.hideAllScreens = function() {
  Object.values(this.dom.screens || {}).forEach(el => {
    if (el) el.classList.add("hidden");
  });
};

QuizUI.prototype.showWelcomeScreen = function() {
  this.hideAllScreens();
  this.dom.screens.welcome.classList.remove("hidden");
  this.initializeWelcomeScreen();
};

QuizUI.prototype.initializeWelcomeScreen = async function() {
  try {
    const metadata = await this.resourceManager.loadMetadata();
    this.themeIndexCache = metadata.themes || [];
    
    // 🆕 Mettre à jour les stats dashboard
    await this.updateWelcomeStats();
    
    // Rendre les thèmes avec la nouvelle structure
    this.renderThemesGrid(this.themeIndexCache);
    
  } catch (error) {
    console.error("Error initializing welcome screen:", error);
    this.showErrorInThemesList("Erreur lors du chargement des thèmes");
  }
};

// 🆕 Stats dashboard sur l'accueil
QuizUI.prototype.updateWelcomeStats = async function() {
  if (!window.storage) {
    console.warn("Storage not available for welcome stats");
    return;
  }
  
  try {
    const statsData = await window.storage.getVisualizationData();
    
    this.updateStatElement('welcome-quizzes-completed', statsData.completedQuizzes || 0);
    this.updateStatElement('welcome-accuracy', `${statsData.globalAccuracy || 0}%`);
    this.updateStatElement('welcome-themes-progress', `${this.getCompletedThemesCount(statsData)}/10`);
    this.updateStatElement('welcome-streak', this.calculateCurrentStreak(statsData) || 0);
    
    console.log("Welcome stats updated:", statsData);
    
  } catch (error) {
    console.warn("Could not load stats for welcome screen:", error);
  }
};

QuizUI.prototype.updateStatElement = function(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
};

QuizUI.prototype.getCompletedThemesCount = function(statsData) {
  if (!statsData.themeStats) return 0;
  
  let completedCount = 0;
  Object.values(statsData.themeStats).forEach(themeData => {
    if (themeData.completionRate === 100) {
      completedCount++;
    }
  });
  return completedCount;
};

QuizUI.prototype.calculateCurrentStreak = function(statsData) {
  if (!statsData.history || statsData.history.length === 0) return 0;
  
  let streak = 0;
  for (let i = 0; i < statsData.history.length; i++) {
    const result = statsData.history[i];
    if (result.accuracy >= 70) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

QuizUI.prototype.renderThemesGrid = function(themes) {
  const container = document.getElementById('themes-list');
  if (!container) {
    console.error("Themes container not found");
    return;
  }
  
  container.innerHTML = "";

  if (!themes || themes.length === 0) {
    container.innerHTML = '<p class="loading-message">Aucun thème disponible</p>';
    return;
  }

  themes.forEach(theme => {
    const progress = this.getThemeProgress(theme.id);
    const completionPercent = Math.round((progress.completed / progress.total) * 100) || 0;
    
    const el = document.createElement("div");
    el.className = "selection-item theme-item";
    el.setAttribute("data-theme-id", theme.id);
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Thème : ${theme.name}`);
    el.innerHTML = `
      <div class="item-icon"><i class="${theme.icon || 'fas fa-book'}"></i></div>
      <div class="item-content">
        <h3>${theme.name}</h3>
        <p>${theme.description || ''}</p>
        <div class="progress-info">
          <div class="progress-bar">
            <div class="progress" style="width: ${completionPercent}%"></div>
          </div>
          <span>${progress.completed}/${progress.total} quiz terminés (${completionPercent}%)</span>
        </div>
      </div>
      <div class="item-action" aria-hidden="true">Explorer <i class="fas fa-arrow-right"></i></div>
    `;
    container.appendChild(el);
  });
};

QuizUI.prototype.showErrorInThemesList = function(message) {
  const container = document.getElementById('themes-list');
  if (container) {
    container.innerHTML = `<p class="error-message">${message}</p>`;
  }
};

QuizUI.prototype.getThemeProgress = function(themeId) {
  const theme = this.themeIndexCache?.find(t => t.id === themeId);
  const total = theme?.quizzes?.length || 5;
  
  if (!window.storage) {
    return { completed: 0, total };
  }
  
  try {
    const progress = window.storage.getProgress();
    if (!progress?.themes?.[themeId]?.quizzes) {
      return { completed: 0, total };
    }
    
    const themeQuizzes = progress.themes[themeId].quizzes;
    const completed = Object.values(themeQuizzes).filter(quiz => quiz.completed).length;
    
    return { completed, total };
  } catch (error) {
    console.warn("Error getting theme progress:", error);
    return { completed: 0, total };
  }
};

// 🔧 CORRECTION - Event listeners unifiés et non dupliqués
QuizUI.prototype.setupEventListeners = function() {
  console.log("Setting up UI event listeners...");

  // Stats buttons
  if (this.dom.buttons?.showStats) {
    this.dom.buttons.showStats.addEventListener('click', () => {
      this.showStatsScreen();
    });
  }

  const showStatsFromQuizBtn = document.getElementById('show-stats-btn-from-quiz');
  if (showStatsFromQuizBtn) {
    showStatsFromQuizBtn.addEventListener('click', () => {
      this.showStatsScreen();
    });
  }

  // Timer checkbox
  if (this.dom.quiz?.timer?.checkbox) {
    this.dom.quiz.timer.checkbox.addEventListener('change', (e) => {
      this.quizManager.timerEnabled = e.target.checked;
    });
  }

  // 🔧 CORRECTION - Un seul event listener pour les thèmes
  const themesContainer = document.getElementById('themes-list');
  if (themesContainer) {
    themesContainer.addEventListener('click', (event) => {
      const themeItem = event.target.closest('.theme-item');
      if (themeItem) {
        const themeId = themeItem.getAttribute('data-theme-id');
        if (themeId) {
          this.quizManager.currentThemeId = parseInt(themeId, 10);
          this.showQuizSelection();
        }
      }
    });
  }

  // Navigation buttons
  if (this.dom.buttons?.backToThemes) {
    this.dom.buttons.backToThemes.addEventListener('click', () => {
      this.showWelcomeScreen();
    });
  }

  const backFromStatsBtn = document.getElementById('back-to-themes-from-stats');
  if (backFromStatsBtn) {
    backFromStatsBtn.addEventListener('click', () => {
      this.showWelcomeScreen();
    });
  }

  const backToQuizSelectionBtn = document.getElementById('back-to-quiz-selection-from-results');
  if (backToQuizSelectionBtn) {
    backToQuizSelectionBtn.addEventListener('click', () => {
      this.showQuizSelection();
    });
  }

  // Quiz controls
  if (this.dom.buttons?.exitQuiz) {
    this.dom.buttons.exitQuiz.addEventListener('click', () => {
      this.showExitConfirmation();
    });
  }

  if (this.dom.buttons?.prev) {
    this.dom.buttons.prev.addEventListener('click', () => {
      if (this.quizManager.goToPreviousQuestion()) {
        this.renderCurrentQuestion();
        this.updateNavigationButtons();
        this.updateProgressBar();
      }
    });
  }

  if (this.dom.buttons?.next) {
    this.dom.buttons.next.addEventListener('click', () => {
      if (this.quizManager.goToNextQuestion()) {
        this.renderCurrentQuestion();
        this.updateNavigationButtons();
        this.updateProgressBar();
      }
    });
  }

  if (this.dom.buttons?.submit) {
    this.dom.buttons.submit.addEventListener('click', () => {
      const results = this.quizManager.submitQuiz();
      this.showResults(results);
    });
  }

  if (this.dom.quiz?.timer?.toggle) {
    this.dom.quiz.timer.toggle.addEventListener('click', () => {
      this.toggleTimerDisplay();
    });
  }

  // CTA buttons dans les résultats
  this.setupResultsCTAButtons();

  // Bouton copier
  this.setupCopyButton();

  console.log("UI event listeners setup complete.");
};

QuizUI.prototype.setupResultsCTAButtons = function() {
  const ctaExploreBtn = document.getElementById('cta-explore-themes');
  if (ctaExploreBtn) {  
    ctaExploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showWelcomeScreen();
    });
  }
  
  const ctaStatsBtn = document.getElementById('cta-view-stats');
  if (ctaStatsBtn) {
    ctaStatsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showStatsScreen();
    });
  }
  
  const ctaTryAgainBtn = document.getElementById('cta-try-again');
  if (ctaTryAgainBtn) {
    ctaTryAgainBtn.addEventListener('click', () => {
      if (this.quizManager.currentThemeId && this.quizManager.currentQuizData) {
        this.quizManager.startQuiz(this.quizManager.currentThemeId, this.quizManager.currentQuizData.id);
        this.showQuizScreen();
      }
    });
  }
};

QuizUI.prototype.setupCopyButton = function() {
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const shareText = document.getElementById('share-text');
      if (shareText) {
        shareText.select();
        navigator.clipboard.writeText(shareText.value).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fas fa-check"></i> Copié!';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 2000);
        }).catch(err => {
          console.error('Erreur lors de la copie:', err);
        });
      }
    });
  }
};

QuizUI.prototype.showExitConfirmation = function() {
  if (confirm('Êtes-vous sûr de vouloir quitter ce quiz ? Votre progression sera perdue.')) {
    this.showQuizSelection();
  }
};

QuizUI.prototype.showQuizSelection = async function() {
  const themeId = this.quizManager.currentThemeId;
  if (!themeId) return this.showWelcomeScreen();

  this.hideAllScreens();
  this.dom.screens.quizSelection.classList.remove("hidden");

  const theme = this.themeIndexCache?.find(t => t.id === themeId);
  if (this.dom.themeTitle) this.dom.themeTitle.textContent = theme?.name || `Thème ${themeId}`;
  if (this.dom.themeDescription) this.dom.themeDescription.textContent = theme?.description || "";

  try {
    const quizzes = await this.resourceManager.getThemeQuizzes(themeId);
    
    const container = document.getElementById('quizzes-list');
    if (!container) {
      console.error("Quizzes container not found");
      return;
    }
    
    container.innerHTML = "";

    quizzes.forEach(quiz => {
      const isCompleted = this.isQuizCompleted(quiz.id);
      const el = document.createElement("div");
      el.className = `selection-item quiz-item ${isCompleted ? 'completed' : ''}`;
      el.setAttribute("data-quiz-id", quiz.id);
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.innerHTML = `
        <div class="item-icon">
          <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-question-circle'}"></i>
        </div>
        <div class="item-content">
          <h3>${quiz.name}</h3>
          <p>${quiz.description || ''}</p>
          ${isCompleted ? '<span class="completion-badge">✅ Terminé</span>' : ''}
        </div>
        <div class="item-action" aria-hidden="true">
          ${isCompleted ? 'Refaire' : 'Démarrer'} <i class="fas fa-arrow-right"></i>
        </div>
      `;
      container.appendChild(el);
    });

    // Event listener pour les quiz
    container.addEventListener("click", async (e) => {
      const item = e.target.closest(".quiz-item");
      if (!item) return;
      const quizId = item.dataset.quizId;
      if (quizId) {
        console.log(`Starting quiz ${quizId} for theme ${themeId}`);
        await this.quizManager.startQuiz(themeId, Number(quizId));
        this.showQuizScreen();
      }
    });
    
  } catch (error) {
    console.error("Error loading quizzes:", error);
    const container = document.getElementById('quizzes-list');
    if (container) {
      container.innerHTML = "<p class='error-message'>Erreur lors du chargement des quiz.</p>";
    }
  }
};

QuizUI.prototype.isQuizCompleted = function(quizId) {
  if (!window.storage || !this.quizManager.currentThemeId) return false;
  
  try {
    const progress = window.storage.getProgress();
    if (!progress?.themes?.[this.quizManager.currentThemeId]?.quizzes) return false;
    
    const quizResult = progress.themes[this.quizManager.currentThemeId].quizzes[quizId];
    return quizResult && quizResult.completed;
  } catch (error) {
    console.warn("Error checking quiz completion:", error);
    return false;
  }
};

QuizUI.prototype.showQuizScreen = function() {
  this.hideAllScreens();
  this.dom.screens.quiz.classList.remove("hidden");
  
  if (this.dom.quiz?.feedback) {
    this.dom.quiz.feedback.classList.add('hidden');
    this.dom.quiz.feedback.innerHTML = '';
  }
  
  if (this.dom.quiz?.title && this.quizManager.currentQuizData) {
    this.dom.quiz.title.textContent = this.quizManager.currentQuizData.name || "Quiz";
  }
  
  this.renderCurrentQuestion();
  this.updateNavigationButtons();
  this.updateProgressBar();
};

// 🎵 CORRECTION AUDIO MAJEURE - Utilise resourceManager.getAudioPath()
QuizUI.prototype.renderCurrentQuestion = function() {
  console.log("🔧 DEBUG: Rendering question - START");
  
  const container = this.dom.quiz?.container;
  if (!container) {
    console.error("❌ Quiz container not found!");
    return;
  }

  const question = this.quizManager.getCurrentQuestion();
  if (!question) {
    container.innerHTML = "<p>Question introuvable.</p>";
    console.error("❌ No question data available");
    return;
  }

  console.log("✅ Question data:", question);

  const questionText = question.question || question.text || "Question sans texte";
  const selectedIndex = this.quizManager.getSelectedAnswer();
  
  // 🎵 CORRECTION AUDIO - Utilise resourceManager au lieu de la fonction locale
  const audioHTML = question.audio
    ? `<div class="question-audio-container">
         <audio controls class="question-audio" src="${this.resourceManager.getAudioPath(this.quizManager.currentThemeId, question.audio)}"></audio>
       </div>`
    : "";

  const optionsHTML = question.options && Array.isArray(question.options)
    ? question.options.map((opt, idx) => `
        <div class="option" data-index="${idx}" tabindex="0" role="button" 
             aria-label="Option ${idx + 1}" 
             ${selectedIndex === idx ? 'style="background-color: var(--primary); color: white;"' : ''}>
          <span class="option-letter">${String.fromCharCode(65 + idx)}.</span>
          <span class="option-text">${opt}</span>
        </div>
      `).join('')
    : '<p>Aucune option disponible</p>';

  container.innerHTML = `
    <div class="question-header">
      <span class="question-number">Question ${this.quizManager.currentQuestionIndex + 1}</span>
    </div>
    <div class="question-text">
      <p>${questionText}</p>
    </div>
    ${audioHTML}
    <div class="question-options">
      ${optionsHTML}
    </div>
  `;

  // Event delegation sur le container
  console.log("🔧 Setting up click handlers...");
  
  container.addEventListener('click', (event) => {
    const option = event.target.closest('.option');
    if (!option) return;
    
    const index = parseInt(option.dataset.index);
    if (isNaN(index)) return;
    
    console.log(`🎯 Option ${index} clicked!`);
    
    try {
      this.quizManager.selectAnswer(index);
      
      container.querySelectorAll('.option').forEach(opt => {
        opt.style.backgroundColor = '';
        opt.style.color = '';
      });
      option.style.backgroundColor = 'var(--primary)';
      option.style.color = 'white';
      
      this.showQuestionFeedback(question, index);
      this.updateNavigationButtons();
      
      console.log(`✅ Selection completed for option ${index}`);
      
    } catch (error) {
      console.error(`❌ Error selecting answer:`, error);
    }
  });

  console.log("✅ Event handlers set up successfully");
};

QuizUI.prototype.showQuestionFeedback = function(question, selectedIndex) {
  const feedbackContainer = this.dom.quiz?.feedback;
  if (!feedbackContainer) return;

  const correctAnswer = question.correctAnswer;
  const selectedAnswer = question.options[selectedIndex];
  const isCorrect = selectedAnswer === correctAnswer;

  const explanationHTML = question.explanation 
    ? `<div class="feedback-explanation">
         <strong><i class="fas fa-lightbulb"></i> Le saviez-vous ?</strong>
         <p>${question.explanation}</p>
       </div>`
    : '';

  const feedbackHTML = `
    <div class="feedback-content ${isCorrect ? 'correct' : 'incorrect'}">
      <div class="feedback-result">
        <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        <span class="feedback-status">${isCorrect ? 'Correct !' : 'Incorrect'}</span>
      </div>
      
      ${!isCorrect ? `
        <div class="feedback-answer">
          <strong>Bonne réponse :</strong> ${correctAnswer}
        </div>
      ` : ''}
      
      ${explanationHTML}
      
      <div class="feedback-actions">
        <button class="btn-feedback-continue" onclick="this.parentElement.parentElement.parentElement.classList.add('hidden')">
          <i class="fas fa-arrow-right"></i> Continuer
        </button>
      </div>
    </div>
  `;

  feedbackContainer.innerHTML = feedbackHTML;
  feedbackContainer.classList.remove('hidden');

  if (isCorrect && this.feedbackTimeout) {
    clearTimeout(this.feedbackTimeout);
  }
  
  if (isCorrect) {
    this.feedbackTimeout = setTimeout(() => {
      feedbackContainer.classList.add('hidden');
    }, 5000);
  }
};

QuizUI.prototype.updateNavigationButtons = function() {
  const prevBtn = this.dom.buttons?.prev;
  const nextBtn = this.dom.buttons?.next;
  const submitBtn = this.dom.buttons?.submit;

  if (!this.quizManager.currentQuizData) return;

  if (prevBtn) {
    prevBtn.disabled = this.quizManager.isFirstQuestion();
  }

  const isLastQuestion = this.quizManager.isLastQuestion();
  const hasAnswer = this.quizManager.hasAnsweredCurrentQuestion();

  if (nextBtn && submitBtn) {
    if (isLastQuestion) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-flex';
      submitBtn.disabled = !hasAnswer;
    } else {
      nextBtn.style.display = 'inline-flex';
      submitBtn.style.display = 'none';
      nextBtn.disabled = !hasAnswer;
    }
  }
};

QuizUI.prototype.updateProgressBar = function() {
  const progressBar = this.dom.quiz?.progress?.bar;
  const progressSteps = this.dom.quiz?.progress?.steps;

  if (!this.quizManager.currentQuizData) return;

  const progress = this.quizManager.getQuizProgress();

  if (progressBar) {
    progressBar.style.width = `${progress.percentage}%`;
  }

  if (progressSteps) {
    const totalQuestions = progress.total;
    progressSteps.innerHTML = '';

    for (let i = 0; i < totalQuestions; i++) {
      const step = document.createElement('div');
      step.className = 'progress-step';
      
      if (i < progress.current - 1) {
        step.classList.add('completed');
      } else if (i === progress.current - 1) {
        step.classList.add('current');
      }
      
      progressSteps.appendChild(step);
    }
  }
};

QuizUI.prototype.showResults = function(results) {
  if (!results) {
    console.error("No results data provided");
    return;
  }

  this.hideAllScreens();
  this.dom.screens.result.classList.remove("hidden");

  const quiz = this.quizManager.currentQuizData;
  const container = this.dom.results?.summary;

  if (!quiz) {
    console.error("Missing quiz data");
    return;
  }

  if (this.dom.results.quizName) {
    this.dom.results.quizName.textContent = quiz.name || "Quiz terminé";
  }

  if (this.dom.results.score) {
    this.dom.results.score.textContent = `${results.score}/${results.total}`;
  }

  if (this.dom.results.message) {
    const levelAssessment = this.calculateQuizLevel(results.percentage);
    this.dom.results.message.innerHTML = levelAssessment;
  }

  if (container) {
    container.innerHTML = "";

    quiz.questions.forEach((question, idx) => {
      const userAnswerIndex = this.quizManager.selectedAnswers[idx];
      const isAnswered = userAnswerIndex !== null;
      
      const userAnswerText = isAnswered && question.options[userAnswerIndex]
        ? question.options[userAnswerIndex]
        : "Non répondu";
      
      const correctAnswerText = question.correctAnswer || "Réponse non définie";
      const isCorrect = isAnswered && userAnswerText === correctAnswerText;

      const item = document.createElement("div");
      item.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
      item.innerHTML = `
        <div class="result-question">
          <strong>Question ${idx + 1}:</strong> ${question.question || question.text}
        </div>
        <div class="result-answers">
          <div class="user-answer">
            <span class="answer-label">Votre réponse:</span>
            <span class="answer-text ${isCorrect ? 'correct' : 'incorrect'}">${userAnswerText}</span>
          </div>
          <div class="correct-answer">
            <span class="answer-label">Bonne réponse:</span>
            <span class="answer-text correct">${correctAnswerText}</span>
          </div>
        </div>
        ${question.explanation ? `<div class="explanation"><strong>Explication:</strong> ${question.explanation}</div>` : ''}
        <div class="result-status">
          ${isCorrect ? '<i class="fas fa-check-circle"></i> Correct' : '<i class="fas fa-times-circle"></i> Incorrect'}
        </div>
      `;
      container.appendChild(item);
    });
  } else {
    console.warn("Results summary container not found - skipping detailed results");
  }

  this.updateShareText(quiz, results);
  this.saveQuizResults(results);
};

QuizUI.prototype.updateShareText = function(quiz, results) {
  const shareTextEl = this.dom.results?.shareText;
  if (shareTextEl) {
    const url = window.location.origin + window.location.pathname;
    shareTextEl.value = `Mon score au quiz "${quiz.name}" sur Test Your French : ${results.score}/${results.total} ! Testez-vous ici : ${url}`;
  }
};

QuizUI.prototype.calculateQuizLevel = function(percentage) {
  let level, message, color;
  
  if (percentage >= 90) {
    level = "A2+";
    message = "🏆 Excellent ! Vous maîtrisez parfaitement ce sujet !<br>Vous êtes prêt(e) pour des défis plus avancés.";
    color = "#4CAF50";
  } else if (percentage >= 80) {
    level = "A2";
    message = "🌟 Très bien ! Vous avez une solide compréhension.<br>Quelques révisions et vous atteindrez l'excellence !";
    color = "#8BC34A";
  } else if (percentage >= 70) {
    level = "A1+";
    message = "👏 Bien joué ! Vous progressez de manière constante.<br>Continuez sur cette lancée !";
    color = "#FFC107";
  } else if (percentage >= 60) {
    level = "A1";
    message = "👍 Bon travail ! Les bases sont acquises.<br>Un peu plus de pratique vous mènera au niveau supérieur.";
    color = "#FF9800";
  } else if (percentage >= 40) {
    level = "Pré-A1";
    message = "💪 Continuez vos efforts ! Vous êtes sur la bonne voie.<br>La persévérance paie toujours !";
    color = "#FF5722";
  } else {
    level = "Débutant";
    message = "🌱 Tout le monde doit commencer quelque part !<br>Chaque erreur est une leçon apprise.";
    color = "#9E9E9E";
  }
  
  return `
    <div class="level-assessment" style="border-left: 4px solid ${color};">
      <div class="level-badge" style="background-color: ${color};">
        Niveau : ${level}
      </div>
      <div class="level-message">${message}</div>
      <div class="level-score">Score : ${Math.round(percentage)}% (${Math.round(percentage/10)}/10)</div>
    </div>
  `;
};

QuizUI.prototype.saveQuizResults = async function(results) {
  if (window.storage && this.quizManager.currentQuizData) {
    try {
      const theme = this.themeIndexCache?.find(t => t.id === this.quizManager.currentThemeId);
      const quiz = this.quizManager.currentQuizData;
      
      const quizResult = {
        theme: {
          id: this.quizManager.currentThemeId,
          name: theme?.name || `Theme ${this.quizManager.currentThemeId}`
        },
        quiz: {
          id: quiz.id,
          name: quiz.name || `Quiz ${quiz.id}`
        },
        score: results.score,
        total: results.total,
        accuracy: results.percentage,
        completed: true,
        dateCompleted: new Date().toISOString(),
        totalTime: results.timeElapsed || 0
      };
      
      const success = await window.storage.saveQuizResult(
        this.quizManager.currentThemeId, 
        quiz.id, 
        quizResult
      );
      
      if (success) {
        console.log("Quiz results saved successfully");
        
        const newBadges = await window.storage.checkAndAwardBadges(quizResult);
        if (newBadges.length > 0) {
          console.log("New badges awarded:", newBadges);
        }
        
        this.updateWelcomeStats().catch(error => {
          console.warn("Could not update welcome stats after quiz:", error);
        });
        
      } else {
        console.warn("Failed to save quiz results");
      }
      
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  }
};

QuizUI.prototype.showStatsScreen = function() {
  this.hideAllScreens();
  if (this.dom.screens.stats) {
    this.dom.screens.stats.classList.remove("hidden");
    this.loadDetailedStats();
  }
};

QuizUI.prototype.loadDetailedStats = async function() {
  if (!window.storage) {
    console.warn("Storage not available for detailed stats");
    return;
  }
  
  try {
    const statsData = await window.storage.getVisualizationData();
    this.updateDetailedStatsElements(statsData);
  } catch (error) {
    console.error("Error loading detailed stats:", error);
  }
};

QuizUI.prototype.updateDetailedStatsElements = function(statsData) {
  const elements = {
    'stats-themes-completed': `${this.getCompletedThemesCount(statsData)}/10`,
    'stats-quizzes-completed': `${statsData.completedQuizzes || 0}/50`,
    'stats-questions-correct': `${statsData.correctAnswers || 0}/${statsData.totalQuestions || 500}`,
    'stats-average-score': `${statsData.globalAccuracy || 0}%`
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
  
  this.updateThemePerformanceBars(statsData.themeStats || {});
  
  if (statsData.bestTheme) {
    this.updateStatElement('best-theme-name', statsData.bestTheme.stats.name);
    this.updateStatElement('best-theme-accuracy', `${statsData.bestTheme.stats.avgAccuracy}%`);
  }
  
  if (statsData.worstTheme) {
    this.updateStatElement('worst-theme-name', statsData.worstTheme.stats.name);
    this.updateStatElement('worst-theme-accuracy', `${statsData.worstTheme.stats.avgAccuracy}%`);
  }
  
  this.updateRecentHistory(statsData.history || []);
};

QuizUI.prototype.updateThemePerformanceBars = function(themeStats) {
  const container = document.getElementById('themes-bars-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const themes = Object.values(themeStats);
  if (themes.length === 0) {
    container.innerHTML = '<p class="no-data">Aucune donnée de performance disponible.</p>';
    return;
  }
  
  themes.forEach(theme => {
    const barEl = document.createElement('div');
    barEl.className = 'theme-bar';
    barEl.innerHTML = `
      <div class="theme-bar-header">
        <span class="theme-name">${theme.name}</span>
        <span class="theme-value">${theme.avgAccuracy}%</span>
      </div>
      <div class="theme-bar-bg">
        <div class="theme-bar-fill" style="width: ${theme.avgAccuracy}%"></div>
      </div>
      <div class="theme-completion">${theme.quizzes.completed}/${theme.quizzes.total} quiz terminés</div>
    `;
    container.appendChild(barEl);
  });
};

QuizUI.prototype.updateRecentHistory = function(history) {
  const container = document.getElementById('quiz-history-list');
  if (!container) {
    console.warn("History container 'quiz-history-list' not found");
    return;
  }
  
  if (history.length === 0) {
    container.innerHTML = '<p class="no-history">Aucun historique de quiz terminé.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  history.slice(0, 10).forEach(item => {
    const historyEl = document.createElement('div');
    historyEl.className = 'history-item';
    
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('fr-FR');
    const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    historyEl.innerHTML = `
      <div class="history-content">
        <div class="history-title">${item.quizName}</div>
        <div class="history-details">
          <span class="history-date">${formattedDate}</span>
          <span class="history-time">${formattedTime}</span>
        </div>
      </div>
      <div class="history-score">${item.score}/${item.total}</div>
    `;
    container.appendChild(historyEl);
  });
};

QuizUI.prototype.toggleTimerDisplay = function() {
  const timerContainer = this.dom.quiz?.timer?.container;
  if (timerContainer) {
    timerContainer.classList.toggle('hidden');
  }
};
        