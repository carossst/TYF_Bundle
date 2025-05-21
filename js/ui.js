/* ui.js – version complète avec gestion d’écran, sélection de thème, quiz et questions */
console.log("QuizUI initialized (Simplified version)");

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

  if (this.dom.welcomeScreen?.showStatsBtn) {
    this.dom.welcomeScreen.showStatsBtn.addEventListener('click', () => {
      this.showStatsScreen?.();
    });
  }

  if (this.dom.welcomeScreen?.enableTimerCheckbox) {
    this.dom.welcomeScreen.enableTimerCheckbox.addEventListener('change', (e) => {
      this.quizManager.setTimerEnabled?.(e.target.checked);
    });
  }

  if (this.dom.themesList) {
    this.dom.themesList.addEventListener('click', (event) => {
      const themeItem = event.target.closest('.theme-item');
      if (themeItem) {
        const themeId = themeItem.getAttribute('data-theme-id');
        if (themeId) {
          this.quizManager.currentThemeId = parseInt(themeId, 10);
          this.showQuizSelection?.();
        }
      }
    });
  }

  if (this.dom.quizSelectionScreen?.backToThemesBtn) {
    this.dom.quizSelectionScreen.backToThemesBtn.addEventListener('click', () => {
      this.showWelcomeScreen();
    });
  }

  if (this.dom.quizSelectionScreen?.showStatsBtn) {
    this.dom.quizSelectionScreen.showStatsBtn.addEventListener('click', () => {
      this.showStatsScreen?.();
    });
  }

  if (this.dom.quizScreen?.exitQuizBtn) {
    this.dom.quizScreen.exitQuizBtn.addEventListener('click', () => {
      this.showWelcomeScreen(); // fallback si pas de méthode exitQuizConfirmation
    });
  }

  if (this.dom.quizScreen?.prevBtn) {
    this.dom.quizScreen.prevBtn.addEventListener('click', () => {
      this.quizManager.goToPreviousQuestion?.();
      this.renderCurrentQuestion?.();
    });
  }

  if (this.dom.quizScreen?.nextBtn) {
    this.dom.quizScreen.nextBtn.addEventListener('click', () => {
      this.quizManager.goToNextQuestion?.();
      this.renderCurrentQuestion?.();
    });
  }

  if (this.dom.quizScreen?.submitBtn) {
    this.dom.quizScreen.submitBtn.addEventListener('click', () => {
      this.quizManager.submitQuiz?.();
      this.showResults?.();
    });
  }

  if (this.dom.quizScreen?.timerToggle) {
    this.dom.quizScreen.timerToggle.addEventListener('click', () => {
      this.toggleTimerDisplay?.();
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

  container.addEventListener("click", (e) => {
    const item = e.target.closest(".quiz-item");
    if (!item) return;
    const quizId = item.dataset.quizId;
    if (quizId) {
      this.quizManager.startQuiz?.(themeId, Number(quizId));
      this.renderCurrentQuestion?.();
    }
  });
};

QuizUI.prototype.renderCurrentQuestion = function() {
  const container = this.dom.quiz.container;
  if (!container) return;

  this.hideAllScreens();
  this.dom.screens.quiz.classList.remove("hidden");

  const question = this.quizManager.getCurrentQuestion?.();
  if (!question) {
    container.innerHTML = "<p>Question introuvable.</p>";
    return;
  }

  container.innerHTML = `
    <div class="question-text"><strong>${question.text}</strong></div>
    <div class="question-options">
      ${question.options.map((opt, idx) => `
        <div class="option" data-index="${idx}" tabindex="0" role="button">
          ${opt}
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.option').forEach(optionEl => {
    optionEl.addEventListener('click', () => {
      const index = parseInt(optionEl.dataset.index, 10);
      this.quizManager.selectAnswer?.(index);
    });
  });
};
