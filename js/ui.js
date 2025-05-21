/* ui.js – version complète générée automatiquement */
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

// Méthode : afficher l'écran d'accueil et lancer le chargement
QuizUI.prototype.showWelcomeScreen = function() {
  this.hideAllScreens();
  this.dom.screens.welcome.classList.remove('hidden');
  this.initializeWelcomeScreen();
  this.quizManager.resetQuizState();
  this.stopTimer?.();
};

// Méthode : charger les thèmes et les afficher
QuizUI.prototype.initializeWelcomeScreen = async function() {
  console.log("Initializing welcome screen...");
  if (this.dom.themesList) {
    this.dom.themesList.innerHTML = "<p>Chargement des thèmes...</p>";
  }

  try {
    const metadata = await this.resourceManager.loadMetadata();
    if (!metadata || !metadata.themes || !Array.isArray(metadata.themes)) {
      throw new Error("Invalid metadata structure");
    }
    this.themeIndexCache = metadata.themes;
    this.renderThemesSimple(metadata.themes);
  } catch (error) {
    console.error("Erreur de chargement des thèmes :", error);
    if (this.dom.themesList) {
      this.dom.themesList.innerHTML = "<p class='error-message'>Impossible de charger les thèmes.</p>";
    }
  }
};

// Méthode : rendu simple des thèmes
QuizUI.prototype.renderThemesSimple = function(themes) {
  const container = this.dom.themesList;
  if (!container) return;
  container.innerHTML = '';

  if (!themes || themes.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun thème disponible.</p>';
    return;
  }

  themes.forEach(theme => {
    const el = document.createElement('div');
    el.className = 'selection-item theme-item';
    el.setAttribute('data-theme-id', theme.id);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Thème : ${theme.name}`);

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

    el.addEventListener('click', () => {
      this.quizManager.currentThemeId = theme.id;
      this.showQuizSelection?.();
    });

    container.appendChild(el);
  });

  console.log("Themes rendered:", themes.length);
};

// Méthode utilitaire : cacher tous les écrans
QuizUI.prototype.hideAllScreens = function() {
  Object.values(this.dom.screens || {}).forEach(el => {
    if (el) el.classList.add('hidden');
  });
};
