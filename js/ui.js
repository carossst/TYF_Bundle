/* ui.js – version finale corrigée */
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

QuizUI.prototype.hideAllScreens = function() {
  Object.values(this.dom.screens || {}).forEach(el => {
    if (el) el.classList.add("hidden");
  });
};
