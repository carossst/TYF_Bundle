// ui.js – Fichier UI simplifié (placeholder pour patch)
// Utilise QuizUI pour afficher les thèmes directement depuis l'écran d'accueil
export default class QuizUI {
  constructor(quizManager, dom, resourceManager) {
    this.quizManager = quizManager;
    this.dom = dom;
    this.resourceManager = resourceManager;
  }

  setupEventListeners() {
    this.dom.buttons.showStats?.addEventListener('click', () => this.showStatsScreen());
    this.dom.buttons.backFromStats?.addEventListener('click', () => this.showWelcomeScreen());
  }

  async showWelcomeScreen() {
    const metadata = await this.resourceManager.loadMetadata();
    const themes = metadata.themes || [];
    this.dom.themesList.innerHTML = themes.map(theme => `
      <div class="selection-item">${theme.name}</div>
    `).join('');
    this._transitionScreen(this.dom.screens.welcome);
  }

  _transitionScreen(screen) {
    Object.values(this.dom.screens).forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
  }

  showStatsScreen() {
    this._transitionScreen(this.dom.screens.stats);
  }
}