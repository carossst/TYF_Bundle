/* ui.js – version complète avec feedback, navigation et évaluations */
console.log("QuizUI initialized (Version complète v2.2.5)");

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
  const metadata = await this.resourceManager.loadMetadata();
  this.themeIndexCache = metadata.themes || [];
  this.renderThemesSimple(this.themeIndexCache);
  this.updateWelcomeStats();
};

QuizUI.prototype.updateWelcomeStats = async function() {
  if (!window.storage) return;
  
  try {
    const userStats = await window.storage.getUserStats();
    // Update welcome screen stats if elements exist
    // This would connect to your welcome stats display
  } catch (error) {
    console.warn("Could not load user stats for welcome screen:", error);
  }
};

QuizUI.prototype.renderThemesSimple = function(themes) {
  const container = this.dom.themesList;
  if (!container) return;
  container.innerHTML = "";

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

QuizUI.prototype.getThemeProgress = function(themeId) {
  // Get theme progress from storage or default
  const theme = this.themeIndexCache?.find(t => t.id === themeId);
  const total = theme?.quizzes?.length || 5;
  
  // This would connect to your storage system
  const completed = this.themeProgress[themeId]?.completed || 0;
  
  return { completed, total };
};

QuizUI.prototype.setupEventListeners = function() {
  console.log("Setting up UI event listeners...");

  // Stats buttons
  if (this.dom.buttons?.showStats) {
    this.dom.buttons.showStats.addEventListener('click', () => {
      this.showStatsScreen();
    });
  }

  // Timer checkbox
  if (this.dom.quiz?.timer?.checkbox) {
    this.dom.quiz.timer.checkbox.addEventListener('change', (e) => {
      this.quizManager.timerEnabled = e.target.checked;
    });
  }

  // Theme selection
  if (this.dom.themesList) {
    this.dom.themesList.addEventListener('click', (event) => {
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

  // Back to themes
  if (this.dom.buttons?.backToThemes) {
    this.dom.buttons.backToThemes.addEventListener('click', () => {
      this.showWelcomeScreen();
    });
  }

  // Quiz navigation
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

  // Timer toggle
  if (this.dom.quiz?.timer?.toggle) {
    this.dom.quiz.timer.toggle.addEventListener('click', () => {
      this.toggleTimerDisplay();
    });
  }

  console.log("UI event listeners setup complete.");
};

QuizUI.prototype.showExitConfirmation = function() {
  if (confirm('Êtes-vous sûr de vouloir quitter ce quiz ? Votre progression sera perdue.')) {
    // ✅ RETOUR: Vers la sélection de quiz du thème actuel
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
    const container = this.dom.quizzesList;
    if (!container) return;
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

    // Show theme completion status
    this.showThemeCompletionStatus(theme, quizzes);
    
  } catch (error) {
    console.error("Error loading quizzes:", error);
    const container = this.dom.quizzesList;
    if (container) {
      container.innerHTML = "<p>Erreur lors du chargement des quiz.</p>";
    }
  }
};

QuizUI.prototype.showThemeCompletionStatus = function(theme, quizzes) {
  const completedQuizzes = quizzes.filter(quiz => this.isQuizCompleted(quiz.id)).length;
  const totalQuizzes = quizzes.length;
  
  if (completedQuizzes === totalQuizzes) {
    this.showThemeFeedback(theme.id, theme.name);
  }
};

QuizUI.prototype.showThemeFeedback = function(themeId, themeName) {
  // Show theme completion feedback
  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'theme-completion-feedback';
  feedbackEl.innerHTML = `
    <div class="theme-feedback-content">
      <h3>🎉 Thème "${themeName}" terminé !</h3>
      <p>Félicitations ! Vous avez terminé tous les quiz de ce thème.</p>
      <div class="theme-level-assessment">
        ${this.calculateThemeLevel(themeId)}
      </div>
    </div>
  `;
  
  // Insert after theme description
  if (this.dom.themeDescription && this.dom.themeDescription.parentNode) {
    this.dom.themeDescription.parentNode.insertBefore(feedbackEl, this.dom.themeDescription.nextSibling);
  }
};

QuizUI.prototype.calculateThemeLevel = function(themeId) {
  // Calculate average score for theme
  const themeResults = this.getThemeResults(themeId);
  if (themeResults.length === 0) return '<p>Niveau non déterminé</p>';
  
  const averageScore = themeResults.reduce((sum, result) => sum + result.percentage, 0) / themeResults.length;
  
  let level, description;
  if (averageScore >= 90) {
    level = "A2+";
    description = "Excellent ! Vous maîtrisez parfaitement ce thème.";
  } else if (averageScore >= 80) {
    level = "A2";
    description = "Très bien ! Vous avez une bonne maîtrise de ce thème.";
  } else if (averageScore >= 70) {
    level = "A1+";
    description = "Bien ! Quelques révisions et vous serez au niveau supérieur.";
  } else if (averageScore >= 60) {
    level = "A1";
    description = "Correct ! Continuez à vous entraîner pour progresser.";
  } else {
    level = "Pré-A1";
    description = "Continuez vos efforts ! La pratique vous aidera à progresser.";
  }
  
  return `
    <div class="level-badge level-${level.toLowerCase().replace('+', 'plus')}">
      <span class="level-text">Niveau : ${level}</span>
    </div>
    <p class="level-description">${description}</p>
    <p class="level-score">Score moyen : ${Math.round(averageScore)}%</p>
  `;
};

QuizUI.prototype.isQuizCompleted = function(quizId) {
  // Check if quiz is completed (would connect to storage)
  return false; // Placeholder
};

QuizUI.prototype.getThemeResults = function(themeId) {
  // Get all quiz results for a theme (would connect to storage)
  return []; // Placeholder
};

QuizUI.prototype.showQuizScreen = function() {
  this.hideAllScreens();
  this.dom.screens.quiz.classList.remove("hidden");
  
  // Clear any existing feedback
  if (this.dom.quiz?.feedback) {
    this.dom.quiz.feedback.classList.add('hidden');
    this.dom.quiz.feedback.innerHTML = '';
  }
  
  // Update quiz title
  if (this.dom.quiz?.title && this.quizManager.currentQuizData) {
    this.dom.quiz.title.textContent = this.quizManager.currentQuizData.name || "Quiz";
  }
  
  this.renderCurrentQuestion();
  this.updateNavigationButtons();
  this.updateProgressBar();
};

// ✅ VERSION CORRIGÉE - Sélection des réponses qui fonctionne !
QuizUI.prototype.renderCurrentQuestion = function() {
  console.log("🔧 DEBUG: Rendering question - START");
  console.log("🔧 DEBUG: this.dom =", this.dom);
  console.log("🔧 DEBUG: this.dom.quiz =", this.dom.quiz);
  
  const container = this.dom.quiz?.container;
  console.log("🔧 DEBUG: container =", container);
  
  if (!container) {
    console.error("❌ Quiz container not found!");
    console.error("❌ Available DOM elements:", Object.keys(this.dom));
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
  
  const audioHTML = question.audio
    ? `<div class="question-audio-container">
         <audio controls class="question-audio" src="./audio/${question.audio}"></audio>
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

  // ✅ NOUVELLE VERSION SIMPLIFIÉE - Event delegation sur le container
  console.log("🔧 Setting up click handlers...");
  
  container.addEventListener('click', (event) => {
    const option = event.target.closest('.option');
    if (!option) return;
    
    const index = parseInt(option.dataset.index);
    if (isNaN(index)) return;
    
    console.log(`🎯 Option ${index} clicked!`);
    
    try {
      // Sélectionner la réponse
      this.quizManager.selectAnswer(index);
      
      // Mettre à jour visuellement
      container.querySelectorAll('.option').forEach(opt => {
        opt.style.backgroundColor = '';
        opt.style.color = '';
      });
      option.style.backgroundColor = 'var(--primary)';
      option.style.color = 'white';
      
      // Afficher feedback
      this.showQuestionFeedback(question, index);
      
      // Mettre à jour boutons
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

  // Déterminer si la réponse est correcte
  const correctAnswer = question.correctAnswer;
  const selectedAnswer = question.options[selectedIndex];
  const isCorrect = selectedAnswer === correctAnswer;

  // ✅ AJOUT: Inclure l'explication quand elle existe
  const explanationHTML = question.explanation 
    ? `<div class="feedback-explanation">
         <strong><i class="fas fa-lightbulb"></i> Le saviez-vous ?</strong>
         <p>${question.explanation}</p>
       </div>`
    : '';

  // Construire le HTML du feedback
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

  // Masquer automatiquement après 5 secondes si correct
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

  // Bouton précédent
  if (prevBtn) {
    prevBtn.disabled = this.quizManager.isFirstQuestion();
  }

  // Boutons suivant/terminer
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

  // Barre de progression
  if (progressBar) {
    progressBar.style.width = `${progress.percentage}%`;
  }

  // Étapes de progression
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

  if (!quiz || !container) {
    console.error("Missing quiz data or results container");
    return;
  }

  // Afficher le score
  if (this.dom.results.quizName) {
    this.dom.results.quizName.textContent = quiz.name || "Quiz terminé";
  }

  if (this.dom.results.score) {
    this.dom.results.score.textContent = `${results.score}`;
  }

  if (this.dom.results.totalQuestions) {
    this.dom.results.totalQuestions.textContent = `${results.total}`;
  }

  // ✅ AJOUT: Évaluation du niveau avec feedback détaillé
  if (this.dom.results.message) {
    const levelAssessment = this.calculateQuizLevel(results.percentage);
    this.dom.results.message.innerHTML = levelAssessment;
  }

  // Résumé détaillé des réponses
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

  // Sauvegarder les résultats
  this.saveQuizResults(results);
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

QuizUI.prototype.saveQuizResults = function(results) {
  if (window.storage && this.quizManager.currentQuizData) {
    const quizResult = {
      quizId: this.quizManager.currentQuizData.id,
      themeId: this.quizManager.currentThemeId,
      score: results.score,
      total: results.total,
      percentage: results.percentage,
      timeElapsed: results.timeElapsed || 0,
      date: new Date().toISOString()
    };
    
    window.storage.saveQuizResult(quizResult).catch(error => {
      console.warn("Failed to save quiz results:", error);
    });
  }
};

QuizUI.prototype.showStatsScreen = function() {
  this.hideAllScreens();
  if (this.dom.screens.stats) {
    this.dom.screens.stats.classList.remove("hidden");
  }
  // TODO: Implémenter l'affichage des statistiques
};

QuizUI.prototype.toggleTimerDisplay = function() {
  const timerContainer = this.dom.quiz?.timer?.container;
  if (timerContainer) {
    timerContainer.classList.toggle('hidden');
  }
};