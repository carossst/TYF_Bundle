/* ui.js – version corrigée pour afficher correctement les questions */
console.log("QuizUI initialized (Version corrigée v2.2.5)");

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
};

QuizUI.prototype.renderThemesSimple = function(themes) {
  const container = this.dom.themesList;
  if (!container) return;
  container.innerHTML = "";

  themes.forEach(theme => {
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
          <div class="progress-bar"><div class="progress" style="width: 0%"></div></div>
          <span>${theme.quizzes?.length || 0} quiz disponibles</span>
        </div>
      </div>
      <div class="item-action" aria-hidden="true">Explorer <i class="fas fa-arrow-right"></i></div>
    `;
    container.appendChild(el);
  });
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
      this.showWelcomeScreen();
    });
  }

  if (this.dom.buttons?.prev) {
    this.dom.buttons.prev.addEventListener('click', () => {
      if (this.quizManager.goToPreviousQuestion()) {
        this.renderCurrentQuestion();
        this.updateNavigationButtons();
      }
    });
  }

  if (this.dom.buttons?.next) {
    this.dom.buttons.next.addEventListener('click', () => {
      if (this.quizManager.goToNextQuestion()) {
        this.renderCurrentQuestion();
        this.updateNavigationButtons();
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
      const el = document.createElement("div");
      el.className = "selection-item quiz-item";
      el.setAttribute("data-quiz-id", quiz.id);
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.innerHTML = `
        <div class="item-icon"><i class="fas fa-question-circle"></i></div>
        <div class="item-content">
          <h3>${quiz.name}</h3>
          <p>${quiz.description || ''}</p>
        </div>
        <div class="item-action" aria-hidden="true">Démarrer <i class="fas fa-arrow-right"></i></div>
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
    const container = this.dom.quizzesList;
    if (container) {
      container.innerHTML = "<p>Erreur lors du chargement des quiz.</p>";
    }
  }
};

QuizUI.prototype.showQuizScreen = function() {
  this.hideAllScreens();
  this.dom.screens.quiz.classList.remove("hidden");
  
  // Mettre à jour le titre du quiz
  if (this.dom.quiz?.title && this.quizManager.currentQuizData) {
    this.dom.quiz.title.textContent = this.quizManager.currentQuizData.name || "Quiz";
  }
  
  this.renderCurrentQuestion();
  this.updateNavigationButtons();
  this.updateProgressBar();
};

QuizUI.prototype.renderCurrentQuestion = function() {
  const container = this.dom.quiz?.container;
  if (!container) {
    console.error("Quiz container not found");
    return;
  }

  const question = this.quizManager.getCurrentQuestion();
  if (!question) {
    container.innerHTML = "<p>Question introuvable.</p>";
    console.error("No question data available");
    return;
  }

  console.log("Rendering question:", question);

  // ✅ CORRECTION : Utiliser question.question au lieu de question.text
  const questionText = question.question || question.text || "Question sans texte";
  
  const audioHTML = question.audio
    ? `<div class="question-audio-container">
         <audio controls class="question-audio" src="./audio/${question.audio}"></audio>
       </div>`
    : "";

  // ✅ CORRECTION : Vérifier que les options existent
  const optionsHTML = question.options && Array.isArray(question.options)
    ? question.options.map((opt, idx) => `
        <div class="option" data-index="${idx}" tabindex="0" role="button" aria-label="Option ${idx + 1}">
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

  // Gestion de la sélection des options
  const options = container.querySelectorAll('.option');
  const selectedIndex = this.quizManager.getSelectedAnswer();

  options.forEach((optionEl, idx) => {
    // Marquer l'option sélectionnée
    if (selectedIndex === idx) {
      optionEl.classList.add("selected");
    }

    // Event listener pour la sélection
    optionEl.addEventListener('click', () => {
      this.quizManager.selectAnswer(idx);
      
      // Mettre à jour l'affichage
      options.forEach(opt => opt.classList.remove("selected"));
      optionEl.classList.add("selected");
      
      // Afficher le feedback immédiat
      this.showQuestionFeedback(question, idx);
      
      // Mettre à jour les boutons de navigation
      this.updateNavigationButtons();
      
      console.log(`Selected option ${idx}: ${question.options[idx]}`);
    });

    // Support clavier
    optionEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        optionEl.click();
      }
    });
  });
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

  // Message de félicitations
  if (this.dom.results.message) {
    const percent = results.percentage;
    let message = "";
    
    if (percent >= 90) {
      message = "🎉 Excellent ! Vous maîtrisez parfaitement ce sujet !";
    } else if (percent >= 70) {
      message = "👏 Très bien ! Quelques petites révisions et ce sera parfait !";
    } else if (percent >= 50) {
      message = "👍 Pas mal ! Continuez à vous entraîner pour progresser !";
    } else {
      message = "💪 Continuez à vous entraîner, vous allez y arriver !";
    }
    
    this.dom.results.message.innerHTML = message;
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

QuizUI.prototype.showQuestionFeedback = function(question, selectedIndex) {
  const feedbackContainer = this.dom.quiz?.feedback;
  if (!feedbackContainer) return;

  // Déterminer si la réponse est correcte
  const correctAnswer = question.correctAnswer;
  const selectedAnswer = question.options[selectedIndex];
  const isCorrect = selectedAnswer === correctAnswer;

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
      
      ${question.explanation ? `
        <div class="feedback-explanation">
          <strong>Explication :</strong> ${question.explanation}
        </div>
      ` : ''}
    </div>
  `;

  feedbackContainer.innerHTML = feedbackHTML;
  feedbackContainer.classList.remove('hidden');

  // Masquer automatiquement après 3 secondes si correct
  if (isCorrect && this.feedbackTimeout) {
    clearTimeout(this.feedbackTimeout);
  }
  
  if (isCorrect) {
    this.feedbackTimeout = setTimeout(() => {
      feedbackContainer.classList.add('hidden');
    }, 3000);
  }
};

QuizUI.prototype.toggleTimerDisplay = function() {
  const timerContainer = this.dom.quiz?.timer?.container;
  if (timerContainer) {
    timerContainer.classList.toggle('hidden');
  }
};